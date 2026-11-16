import { Module, OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { ProductsController } from './products';
import { HealthController } from './health';
import { AuthController } from './auth';
import { OrdersController } from './orders';
import { PromotionsController } from './promotions';
import { AdminController } from './admin';
import { LoyaltyController } from './loyalty';

class ManagedPool extends Pool implements OnApplicationShutdown {
  async onApplicationShutdown() { await this.end(); }
}

@Module({
  controllers: [ProductsController, HealthController, AuthController, OrdersController, PromotionsController, AdminController, LoyaltyController],
  providers: [{ provide: 'PG_POOL', useFactory: () => new ManagedPool({ connectionString: process.env.DATABASE_URL }) }],
})
export class AppModule {}
