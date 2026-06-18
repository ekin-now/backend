import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStripePaymentIntentId1750354800000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS UQ_payments_stripe_intent
      ON payments (stripe_payment_intent_id)
      WHERE stripe_payment_intent_id IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS UQ_payments_stripe_intent`);
    await queryRunner.query(
      `ALTER TABLE payments DROP COLUMN IF EXISTS stripe_payment_intent_id`,
    );
  }
}
