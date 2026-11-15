import { NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { ProductsController } from '../src/products';

describe('ProductsController', () => {
  it('returns only active products from the catalogue', async () => {
    const product = { id: 1, name: 'Cà phê sữa đá', basePrice: 35000, stock: 4 };
    const db = { query: jest.fn().mockResolvedValue({ rows: [product] }) } as unknown as Pool;
    const controller = new ProductsController(db);
    await expect(controller.list()).resolves.toEqual([product]);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE active = TRUE'));
  });

  it('returns not found for an unavailable product', async () => {
    const db = { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }) } as unknown as Pool;
    const controller = new ProductsController(db);
    await expect(controller.get(404)).rejects.toBeInstanceOf(NotFoundException);
  });
});
