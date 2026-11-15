import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { ProductsController } from './products';
import { HealthController } from './health';
import { AuthController } from './auth';
import { OrdersController } from './orders';

@Module({
  controllers: [ProductsController, HealthController, AuthController, OrdersController],
  providers: [{ provide: 'PG_POOL', useFactory: () => new Pool({ connectionString: process.env.DATABASE_URL }) }],
})
export class AppModule {}
