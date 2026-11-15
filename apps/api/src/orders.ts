import { Body, Controller, Get, Headers, Inject, NotFoundException, Param, Post, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { IsArray, IsIn, IsInt, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { createHash, randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { bearer } from './auth';

class OrderLineDto {
  @IsInt() @Min(1) productId!: number;
  @IsInt() @Min(1) @Max(20) quantity!: number;
  @IsString() @IsIn(['SMALL', 'MEDIUM', 'LARGE']) size!: string;
}
class CreateOrderDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderLineDto) items!: OrderLineDto[];
}
class PayDto { @IsString() @IsIn(['WALLET', 'CARD']) method!: string; }

@Controller('orders')
export class OrdersController {
  constructor(@Inject('PG_POOL') private readonly db: Pool) {}

  @Post()
  async create(@Headers('authorization') authorization: string, @Headers('idempotency-key') key: string, @Body() body: CreateOrderDto) {
    const user = bearer(authorization);
    if (!key || key.length > 120) throw new BadRequestException('Idempotency-Key là bắt buộc');
    if (!body.items?.length || body.items.length > 30) throw new BadRequestException('Giỏ hàng rỗng hoặc quá lớn');
    const requestHash = createHash('sha256').update(JSON.stringify(body.items)).digest('hex');
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`${user.sub}:${key}`]);
      const existing = await client.query('SELECT * FROM orders WHERE user_id=$1 AND idempotency_key=$2', [user.sub, key]);
      if (existing.rows[0]) {
        if (existing.rows[0].request_hash !== requestHash) throw new ConflictException('Idempotency-Key đã dùng với nội dung khác');
        const items = await client.query('SELECT product_id AS "productId",product_name AS name,quantity,size,unit_price AS "unitPrice",line_total AS "lineTotal" FROM order_items WHERE order_id=$1', [existing.rows[0].id]);
        await client.query('COMMIT');
        return { ...existing.rows[0], items: items.rows, replayed: true };
      }
      const orderId = randomUUID();
      const lines: any[] = [];
      const remainingStock = new Map<number, number>();
      let total = 0;
      for (const line of body.items) {
        const p = await client.query('SELECT id,name,base_price,stock,active FROM products WHERE id=$1 FOR UPDATE', [line.productId]);
        if (!p.rows[0]?.active) throw new NotFoundException(`Không tìm thấy sản phẩm ${line.productId}`);
        const available = remainingStock.get(line.productId) ?? Number(p.rows[0].stock);
        if (available < line.quantity) throw new ConflictException(`Sản phẩm ${p.rows[0].name} không đủ tồn kho`);
        remainingStock.set(line.productId, available - line.quantity);
        const multiplier = line.size === 'LARGE' ? 1.25 : line.size === 'MEDIUM' ? 1.1 : 1;
        const unitPrice = Math.round(Number(p.rows[0].base_price) * multiplier);
        const lineTotal = unitPrice * line.quantity;
        total += lineTotal;
        lines.push({ ...line, name: p.rows[0].name, unitPrice, lineTotal });
      }
      await client.query('INSERT INTO orders(id,user_id,status,total,idempotency_key,request_hash) VALUES($1,$2,$3,$4,$5,$6)', [orderId, user.sub, 'PENDING_PAYMENT', total, key, requestHash]);
      for (const line of lines) {
        await client.query('UPDATE products SET stock=stock-$1 WHERE id=$2', [line.quantity, line.productId]);
        await client.query('INSERT INTO order_items(order_id,product_id,product_name,quantity,size,unit_price,line_total) VALUES($1,$2,$3,$4,$5,$6,$7)', [orderId, line.productId, line.name, line.quantity, line.size, line.unitPrice, line.lineTotal]);
      }
      await client.query('COMMIT');
      return { id: orderId, status: 'PENDING_PAYMENT', total, items: lines, replayed: false };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

  @Post(':id/pay')
  async pay(@Headers('authorization') authorization: string, @Headers('idempotency-key') key: string, @Param('id') id: string, @Body() body: PayDto) {
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
      if (order.status !== 'PENDING_PAYMENT') throw new ConflictException('Đơn hàng không ở trạng thái chờ thanh toán');
      const success = process.env.PAYMENT_MOCK_MODE !== 'fail';
      const paymentStatus = success ? 'SUCCESS' : 'FAILED';
      await client.query('INSERT INTO payments(id,order_id,method,status,amount,idempotency_key,provider_ref) VALUES($1,$2,$3,$4,$5,$6,$7)', [randomUUID(), id, body.method, paymentStatus, order.total, key, success ? `MOCK-${randomUUID()}` : null]);
      await client.query('UPDATE orders SET status=$1 WHERE id=$2', [success ? 'CONFIRMED' : 'PAYMENT_FAILED', id]);
      if (!success) await client.query(
        'UPDATE products p SET stock=p.stock+reserved.quantity FROM (SELECT product_id,SUM(quantity)::int AS quantity FROM order_items WHERE order_id=$1 GROUP BY product_id) reserved WHERE p.id=reserved.product_id',
        [id],
      );
      await client.query('COMMIT');
      return { orderId: id, status: paymentStatus, orderStatus: success ? 'CONFIRMED' : 'PAYMENT_FAILED', total: Number(order.total), replayed: false };
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }

  @Get('me')
  async history(@Headers('authorization') authorization: string) {
    const user = bearer(authorization);
    const result = await this.db.query('SELECT id,status,total,created_at AS "createdAt" FROM orders WHERE user_id=$1 ORDER BY created_at DESC', [user.sub]);
    return result.rows;
  }
}
