import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { Pool } from 'pg';
import { requireStaff } from './auth';

const ORDER_STATUSES = ['PENDING', 'PAID', 'PREPARING', 'READY', 'COMPLETED', 'PAYMENT_FAILED', 'CANCELLED'];

class CreatePromotionDto {
  @IsString() @MaxLength(40) @Matches(/^[A-Za-z0-9][A-Za-z0-9_-]{2,39}$/) code!: string;
  @IsString() @IsIn(['PERCENT', 'FIXED']) discountType!: 'PERCENT' | 'FIXED';
  @IsInt() @Min(1) @Max(100_000_000) discountValue!: number;
  @IsOptional() @IsInt() @Min(0) @Max(100_000_000) minOrderAmount?: number;
  @IsOptional() @IsInt() @Min(1) @Max(100_000_000) maxDiscount?: number | null;
}

class SetPromotionActiveDto {
  @IsBoolean() active!: boolean;
}

@Controller('admin')
export class AdminController {
  constructor(@Inject('PG_POOL') private readonly db: Pool) {}

  @Get('orders')
  async orders(@Headers('authorization') authorization: string, @Query('status') status?: string) {
    requireStaff(authorization);
    if (status && !ORDER_STATUSES.includes(status)) throw new BadRequestException('Trạng thái đơn không hợp lệ');
    const values = status ? [status] : [];
    const where = status ? 'WHERE o.status = $1' : '';
    const result = await this.db.query(
      `SELECT o.id, o.status, o.subtotal, o.discount_amount AS "discountAmount", o.promo_code AS "promoCode",
              o.total, o.created_at AS "createdAt", u.name AS "customerName", u.email AS "customerEmail",
              COALESCE(json_agg(json_build_object(
                'name', oi.product_name, 'quantity', oi.quantity, 'size', oi.size,
                'toppings', oi.toppings, 'lineTotal', oi.line_total
              ) ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL), '[]'::json) AS items
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${where}
       GROUP BY o.id, u.id
       ORDER BY o.created_at DESC
       LIMIT 200`,
      values,
    );
    return result.rows;
  }

  @Get('promotions')
  async promotions(@Headers('authorization') authorization: string) {
    requireStaff(authorization);
    const result = await this.db.query(
      `SELECT id, code, discount_type AS "discountType", discount_value AS "discountValue",
              min_order_amount AS "minOrderAmount", max_discount AS "maxDiscount", starts_at AS "startsAt",
              ends_at AS "endsAt", active, created_at AS "createdAt"
       FROM promotions ORDER BY created_at DESC`,
    );
    return result.rows;
  }

  @Post('promotions')
  async createPromotion(@Headers('authorization') authorization: string, @Body() body: CreatePromotionDto) {
    requireStaff(authorization);
    const code = body.code.trim().toUpperCase();
    if (body.discountType === 'PERCENT' && body.discountValue > 100) {
      throw new BadRequestException('Phần trăm giảm tối đa là 100%');
    }
    try {
      const result = await this.db.query(
        `INSERT INTO promotions(code, discount_type, discount_value, min_order_amount, max_discount)
         VALUES($1,$2,$3,$4,$5)
         RETURNING id, code, discount_type AS "discountType", discount_value AS "discountValue",
                   min_order_amount AS "minOrderAmount", max_discount AS "maxDiscount", active`,
        [code, body.discountType, body.discountValue, body.minOrderAmount ?? 0, body.maxDiscount ?? null],
      );
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') throw new ConflictException('Mã khuyến mãi đã tồn tại');
      throw error;
    }
  }

  @Patch('promotions/:id')
  async setPromotionActive(
    @Headers('authorization') authorization: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SetPromotionActiveDto,
  ) {
    requireStaff(authorization);
    const result = await this.db.query(
      'UPDATE promotions SET active=$1 WHERE id=$2 RETURNING id, code, active',
      [body.active, id],
    );
    if (!result.rowCount) throw new BadRequestException('Không tìm thấy mã khuyến mãi');
    return result.rows[0];
  }
}
