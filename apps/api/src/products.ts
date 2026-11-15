import { Controller, Get, Inject, NotFoundException, Param, ParseIntPipe } from '@nestjs/common';
import { Pool } from 'pg';

@Controller('products')
export class ProductsController {
  constructor(@Inject('PG_POOL') private readonly db: Pool) {}

  @Get()
  async list() {
    const result = await this.db.query(
      'SELECT id, name, description, category, base_price AS "basePrice", stock, image_url AS "imageUrl" FROM products WHERE active = TRUE ORDER BY id',
    );
    return result.rows;
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    const result = await this.db.query(
      'SELECT id, name, description, category, base_price AS "basePrice", stock, image_url AS "imageUrl" FROM products WHERE id = $1 AND active = TRUE',
      [id],
    );
    if (!result.rowCount) throw new NotFoundException('Không tìm thấy sản phẩm');
    return result.rows[0];
  }
}
