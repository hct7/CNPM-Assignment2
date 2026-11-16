import { BadRequestException, Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import { Pool } from 'pg';
import { calculatePromotionDiscount, findActivePromotion } from './promotion-utils';

class ValidatePromotionDto {
  @IsString() @MaxLength(40) code!: string;
  @IsInt() @Min(0) @Max(100_000_000) subtotal!: number;
}

@Controller('promotions')
export class PromotionsController {
  constructor(@Inject('PG_POOL') private readonly db: Pool) {}

  @Get()
  async listActive() {
    const result = await this.db.query(
      `SELECT code, discount_type AS "discountType", discount_value AS "discountValue",
              min_order_amount AS "minOrderAmount", max_discount AS "maxDiscount", ends_at AS "endsAt"
       FROM promotions
       WHERE active = TRUE AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now())
       ORDER BY created_at DESC`,
    );
    return result.rows;
  }

  @Post('validate')
  async validate(@Body() body: ValidatePromotionDto) {
    const code = body.code.trim().toUpperCase();
    if (!code) throw new BadRequestException('Nhập mã khuyến mãi');
    const promotion = await findActivePromotion(this.db, code);
    if (!promotion) throw new BadRequestException('Mã khuyến mãi không tồn tại hoặc đã hết hạn');
    if (body.subtotal < promotion.minOrderAmount) {
      throw new BadRequestException(`Đơn tối thiểu ${promotion.minOrderAmount.toLocaleString('vi-VN')}đ để dùng mã này`);
    }
    const discountAmount = calculatePromotionDiscount(promotion, body.subtotal);
    return { code: promotion.code, discountAmount, total: body.subtotal - discountAmount };
  }
}
