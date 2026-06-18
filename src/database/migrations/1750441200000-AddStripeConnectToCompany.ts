import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStripeConnectToCompany1750441200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE company
      ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR NULL,
      ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS UQ_company_stripe_account_id
      ON company (stripe_account_id)
      WHERE stripe_account_id IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS UQ_company_stripe_account_id`,
    );
    await queryRunner.query(`
      ALTER TABLE company
      DROP COLUMN IF EXISTS stripe_account_id,
      DROP COLUMN IF EXISTS stripe_onboarding_complete
    `);
  }
}
