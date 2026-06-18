import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSportSubEventFkColumn1750527600000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Delete registrations referencing orphaned sub-events first (FK chain)
    await queryRunner.query(`
      DELETE FROM registrations
      WHERE sub_event_id IN (
        SELECT id FROM sport_sub_events
        WHERE sport_event_id NOT IN (SELECT id FROM sport_events)
           OR sport_event_id IS NULL
      )
    `);

    // Delete orphaned sub-events (sport_event_id points to non-existent events)
    await queryRunner.query(`
      DELETE FROM sport_sub_events
      WHERE sport_event_id NOT IN (SELECT id FROM sport_events)
         OR sport_event_id IS NULL
    `);

    const columns = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'sport_sub_events' AND column_name = 'sportEventId'
    `);

    if (columns.length > 0) {
      await queryRunner.query(
        `ALTER TABLE sport_sub_events DROP COLUMN "sportEventId"`,
      );
    }

    await queryRunner.query(`
      ALTER TABLE sport_sub_events
      ALTER COLUMN sport_event_id SET NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sport_sub_events
      ALTER COLUMN sport_event_id DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE sport_sub_events
      ADD COLUMN IF NOT EXISTS "sportEventId" character varying
    `);
    await queryRunner.query(`
      UPDATE sport_sub_events SET "sportEventId" = sport_event_id::text
    `);
    await queryRunner.query(`
      ALTER TABLE sport_sub_events ALTER COLUMN "sportEventId" SET NOT NULL
    `);
  }
}
