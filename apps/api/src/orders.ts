import { Body, Controller, Get, Headers, Inject, NotFoundException, Param, ParseUUIDPipe, Post, BadRequestException, ConflictException, Patch } from '@nestjs/common';
import { ArrayMaxSize, ArrayUnique, IsArray, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { createHash, randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { bearer, requireStaff } from './auth';
import { canTransition, OrderStatus } from './order-state';
import { calculatePromotionDiscount, findActivePromotion, PromotionRecord } from './promotion-utils';

class OrderLineDto {
  @IsInt() @Min(1) productId!: number;
  @IsInt() @Min(1) @Max(20) quantity!: number;
  @IsString() @IsIn(['SMALL', 'MEDIUM', 'LARGE']) size!: string;
  @IsOptional() @IsArray() @ArrayUnique() @ArrayMaxSize(3) @IsIn(['EXTRA_SHOT', 'PEARL', 'CREAM'], { each: true }) toppings?: string[];
}
class CreateOrderDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderLineDto) items!: OrderLineDto[];
  @IsOptional() @IsString() @MaxLength(40) promoCode?: string;
}
class PayDto { @IsString() @IsIn(['WALLET', 'CARD']) method!: string; }
class UpdateStatusDto { @IsString() @IsIn(['PREPARING', 'READY', 'COMPLETED', 'CANCELLED']) status!: OrderStatus; }

@Controller('orders')
export class OrdersController {
  constructor(@Inject('PG_POOL') private readonly db: Pool) {}

  @Post()
  async create(@Headers('authorization') authorization: string, @Headers('idempotency-key') key: string, @Body() body: CreateOrderDto) {
    const user = bearer(authorization);
    if (!key || key.length > 120) throw new BadRequestException('Idempotency-Key là bắt buộc');
    if (!body.items?.length || body.items.length > 30) throw new BadRequestException('Giỏ hàng rỗng hoặc quá lớn');
    const promoCode = body.promoCode?.trim().toUpperCase() || null;
    const requestHash = createHash('sha256').update(JSON.stringify({ items: body.items, promoCode })).digest('hex');
    const legacyRequestHash = createHash('sha256').update(JSON.stringify(body.items)).digest('hex');
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`${user.sub}:${key}`]);
      const existing = await client.query('SELECT * FROM orders WHERE user_id=$1 AND idempotency_key=$2', [user.sub, key]);
      if (existing.rows[0]) {
        if (existing.rows[0].request_hash !== requestHash && existing.rows[0].request_hash !== legacyRequestHash) {
          throw new ConflictException('Idempotency-Key đã dùng với nội dung khác');
        }
        const items = await client.query('SELECT product_id AS "productId",product_name AS name,quantity,size,toppings,unit_price AS "unitPrice",line_total AS "lineTotal" FROM order_items WHERE order_id=$1', [existing.rows[0].id]);
        await client.query('COMMIT');
        return {
          id: existing.rows[0].id,
          status: existing.rows[0].status,
          subtotal: Number(existing.rows[0].subtotal ?? existing.rows[0].total),
          discountAmount: Number(existing.rows[0].discount_amount ?? 0),
          promoCode: existing.rows[0].promo_code ?? null,
          total: Number(existing.rows[0].total),
          items: items.rows,
          replayed: true,
        };
      }
      const orderId = randomUUID();
      const lines: any[] = [];
      const productSnapshots = new Map<number, any>();
      const requestedStock = new Map<number, number>();
      let subtotal = 0;
      for (const line of [...body.items].sort((a, b) => a.productId - b.productId)) {
        let product = productSnapshots.get(line.productId);
        if (!product) {
          const result = await client.query('SELECT id,name,base_price,stock,stock_version,active FROM products WHERE id=$1', [line.productId]);
          product = result.rows[0];
          if (!product?.active) throw new NotFoundException(`Không tìm thấy sản phẩm ${line.productId}`);
          productSnapshots.set(line.productId, product);
        }
        requestedStock.set(line.productId, (requestedStock.get(line.productId) ?? 0) + line.quantity);
        const multiplier = line.size === 'LARGE' ? 1.25 : line.size === 'MEDIUM' ? 1.1 : 1;
        const toppingPrices: Record<string, number> = { EXTRA_SHOT: 8000, PEARL: 6000, CREAM: 6000 };
        const toppings = line.toppings || [];
        const unitPrice = Math.round(Number(product.base_price) * multiplier) + toppings.reduce((sum, topping) => sum + toppingPrices[topping], 0);
        const lineTotal = unitPrice * line.quantity;
        subtotal += lineTotal;
        lines.push({ ...line, toppings, name: product.name, unitPrice, lineTotal });
      }
      for (const [productId, quantity] of [...requestedStock].sort(([a], [b]) => a - b)) {
        const snapshot = productSnapshots.get(productId);
        const reserved = await client.query(
          `UPDATE products SET stock=stock-$1, stock_version=stock_version+1
           WHERE id=$2 AND stock_version=$3 AND stock >= $1 AND active=TRUE RETURNING id`,
          [quantity, productId, snapshot.stock_version],
        );
        if (!reserved.rowCount) {
          const current = await client.query('SELECT name,stock,active FROM products WHERE id=$1', [productId]);
          if (!current.rows[0]?.active) throw new NotFoundException(`Không tìm thấy sản phẩm ${productId}`);
          throw new ConflictException(`Tồn kho sản phẩm ${current.rows[0].name} vừa thay đổi; còn ${current.rows[0].stock}`);
        }
      }
      let promotion: PromotionRecord | null = null;
      let discountAmount = 0;
      if (promoCode) {
        promotion = await findActivePromotion(client, promoCode, true);
        if (!promotion) throw new BadRequestException('Mã khuyến mãi không tồn tại hoặc đã hết hạn');
        if (subtotal < promotion.minOrderAmount) {
          throw new BadRequestException(`Đơn tối thiểu ${promotion.minOrderAmount.toLocaleString('vi-VN')}đ để dùng mã này`);
        }
        discountAmount = calculatePromotionDiscount(promotion, subtotal);
      }
      const total = subtotal - discountAmount;
      await client.query(
        `INSERT INTO orders(id,user_id,status,subtotal,discount_amount,promotion_id,promo_code,total,idempotency_key,request_hash)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [orderId, user.sub, 'PENDING', subtotal, discountAmount, promotion?.id ?? null, promoCode, total, key, requestHash],
      );
      for (const line of lines) {
        await client.query('INSERT INTO order_items(order_id,product_id,product_name,quantity,size,toppings,unit_price,line_total) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8)', [orderId, line.productId, line.name, line.quantity, line.size, JSON.stringify(line.toppings), line.unitPrice, line.lineTotal]);
      }
      await client.query('COMMIT');
      return { id: orderId, status: 'PENDING', subtotal, discountAmount, promoCode, total, items: lines, replayed: false };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

  @Post(':id/pay')
  async pay(@Headers('authorization') authorization: string, @Headers('idempotency-key') key: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: PayDto) {
    const user = bearer(authorization);
    if (!key || key.length > 120) throw new BadRequestException('Idempotency-Key là bắt buộc');
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const orderResult = await client.query('SELECT * FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE', [id, user.sub]);
      const order = orderResult.rows[0];
      if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
      const old = await client.query('SELECT * FROM payments WHERE order_id=$1 AND idempotency_key=$2', [id, key]);
      if (old.rows[0]) {
        if (old.rows[0].method !== body.method) throw new ConflictException('Idempotency-Key đã dùng với phương thức khác');
        await client.query('COMMIT'); return { orderId: id, status: old.rows[0].status, replayed: true };
      }
      if (!['PENDING', 'PAYMENT_FAILED'].includes(order.status)) throw new ConflictException('Đơn hàng không ở trạng thái chờ thanh toán');
      if (order.status === 'PAYMENT_FAILED') {
        const lines = await client.query('SELECT product_id, SUM(quantity)::int AS quantity FROM order_items WHERE order_id=$1 GROUP BY product_id', [id]);
        for (const line of lines.rows) {
          const snapshot = await client.query('SELECT stock,stock_version,active FROM products WHERE id=$1', [line.product_id]);
          const product = snapshot.rows[0];
          if (!product?.active) throw new ConflictException('Sản phẩm trong đơn không còn bán');
          const reserved = await client.query(
            `UPDATE products SET stock=stock-$1, stock_version=stock_version+1
             WHERE id=$2 AND stock_version=$3 AND stock >= $1 AND active=TRUE RETURNING id`,
            [line.quantity, line.product_id, product.stock_version],
          );
          if (!reserved.rowCount) throw new ConflictException('Tồn kho vừa thay đổi; vui lòng thử thanh toán lại');
        }
        await client.query('UPDATE orders SET status=$1, updated_at=now() WHERE id=$2', ['PENDING', id]);
      }
      if (!canTransition(order.status as OrderStatus, 'PAID') && order.status !== 'PAYMENT_FAILED') throw new ConflictException('Chuyển trạng thái không hợp lệ');
      const success = process.env.PAYMENT_MOCK_MODE !== 'fail';
      const paymentStatus = success ? 'SUCCESS' : 'FAILED';
      await client.query('INSERT INTO payments(id,order_id,method,status,amount,idempotency_key,provider_ref) VALUES($1,$2,$3,$4,$5,$6,$7)', [randomUUID(), id, body.method, paymentStatus, order.total, key, success ? `MOCK-${randomUUID()}` : null]);
      await client.query('UPDATE orders SET status=$1, updated_at=now() WHERE id=$2', [success ? 'PAID' : 'PAYMENT_FAILED', id]);
      let loyaltyPointsAwarded = 0;
      if (success) {
        loyaltyPointsAwarded = Math.floor(Number(order.total) / 10_000);
        if (loyaltyPointsAwarded > 0) {
          const award = await client.query(
            `INSERT INTO loyalty_transactions(id,user_id,order_id,points_delta,reason)
             VALUES($1,$2,$3,$4,'ORDER_PAID')
             ON CONFLICT (order_id) WHERE order_id IS NOT NULL DO NOTHING
             RETURNING points_delta`,
            [randomUUID(), user.sub, id, loyaltyPointsAwarded],
          );
          if (award.rowCount) {
            await client.query('UPDATE users SET loyalty_points=loyalty_points+$1 WHERE id=$2', [loyaltyPointsAwarded, user.sub]);
          } else {
            loyaltyPointsAwarded = 0;
          }
        }
      }
      if (!success) await client.query(
        'UPDATE products p SET stock=p.stock+reserved.quantity, stock_version=p.stock_version+1 FROM (SELECT product_id,SUM(quantity)::int AS quantity FROM order_items WHERE order_id=$1 GROUP BY product_id) reserved WHERE p.id=reserved.product_id',
        [id],
      );
      await client.query('COMMIT');
      return { orderId: id, status: paymentStatus, orderStatus: success ? 'PAID' : 'PAYMENT_FAILED', total: Number(order.total), loyaltyPointsAwarded, replayed: false };
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }

  @Get('me')
  async history(@Headers('authorization') authorization: string) {
    const user = bearer(authorization);
    const result = await this.db.query('SELECT id,status,total,created_at AS "createdAt",updated_at AS "updatedAt" FROM orders WHERE user_id=$1 ORDER BY created_at DESC', [user.sub]);
    return result.rows;
  }

  @Patch(':id/status')
  async updateStatus(@Headers('authorization') authorization: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateStatusDto) {
    requireStaff(authorization);
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query('SELECT status FROM orders WHERE id=$1 FOR UPDATE', [id]);
      if (!current.rows[0]) throw new NotFoundException('Không tìm thấy đơn hàng');
      if (!canTransition(current.rows[0].status as OrderStatus, body.status)) throw new ConflictException(`Chuyển trạng thái không hợp lệ: ${current.rows[0].status} -> ${body.status}`);
      await client.query('UPDATE orders SET status=$1, updated_at=now() WHERE id=$2', [body.status, id]);
      await client.query('COMMIT');
      return { id, status: body.status };
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
}
