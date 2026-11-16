import { Controller, Get, Headers, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { bearer } from './auth';

@Controller('loyalty')
export class LoyaltyController {
  constructor(@Inject('PG_POOL') private readonly db: Pool) {}

  @Get('me')
  async mine(@Headers('authorization') authorization: string) {
    const user = bearer(authorization);
    const [account, transactions] = await Promise.all([
      this.db.query('SELECT loyalty_points AS points FROM users WHERE id=$1', [user.sub]),
      this.db.query(
        `SELECT points_delta AS "pointsDelta", reason, created_at AS "createdAt"
         FROM loyalty_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`,
        [user.sub],
      ),
    ]);
    return { points: Number(account.rows[0]?.points ?? 0), transactions: transactions.rows };
  }
}
