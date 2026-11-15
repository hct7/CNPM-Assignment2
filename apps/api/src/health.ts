import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { Pool } from 'pg';

@Controller('health')
export class HealthController {
  constructor(@Inject('PG_POOL') private readonly db: Pool) {}
  @Get()
  async check() {
    try {
      await this.db.query('SELECT 1');
      return { status: 'ok', database: 'ok' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'unavailable' });
    }
  }
}
