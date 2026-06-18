import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRegistrationsPaymentsResults1750268400000 implements MigrationInterface {
  name = 'CreateRegistrationsPaymentsResults1750268400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."registrations_status_enum" AS ENUM('PENDING','APPROVED','WAITLIST','REJECTED','CANCELLED')`,
    );

    await queryRunner.query(`
      CREATE TABLE "registrations" (
        "id"               uuid          NOT NULL DEFAULT uuid_generate_v4(),
        "participant_id"   uuid          NOT NULL,
        "sport_event_id"   uuid          NOT NULL,
        "sub_event_id"     uuid          NOT NULL,
        "status"           "public"."registrations_status_enum" NOT NULL DEFAULT 'PENDING',
        "notes"            text,
        "createdAt"        TIMESTAMP     NOT NULL DEFAULT now(),
        "updatedAt"        TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_registrations" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "registrations"
        ADD CONSTRAINT "FK_registrations_participant"
          FOREIGN KEY ("participant_id") REFERENCES "user"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "FK_registrations_sport_event"
          FOREIGN KEY ("sport_event_id") REFERENCES "sport_events"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "FK_registrations_sub_event"
          FOREIGN KEY ("sub_event_id") REFERENCES "sport_sub_events"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_registrations_participant_sub_event"
        ON "registrations" ("participant_id", "sub_event_id")`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('PENDING','COMPLETED','FAILED','REFUNDED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_method_enum" AS ENUM('CARD','TRANSFER','CASH','STRIPE')`,
    );

    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id"               uuid          NOT NULL DEFAULT uuid_generate_v4(),
        "registration_id"  uuid          NOT NULL,
        "participant_id"   uuid          NOT NULL,
        "amount"           DECIMAL(10,2) NOT NULL,
        "currency"         varchar       NOT NULL DEFAULT 'EUR',
        "method"           "public"."payments_method_enum"  NOT NULL DEFAULT 'CARD',
        "status"           "public"."payments_status_enum"  NOT NULL DEFAULT 'PENDING',
        "transaction_id"   varchar,
        "notes"            text,
        "createdAt"        TIMESTAMP     NOT NULL DEFAULT now(),
        "updatedAt"        TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
        ADD CONSTRAINT "FK_payments_registration"
          FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "FK_payments_participant"
          FOREIGN KEY ("participant_id") REFERENCES "user"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(
      `CREATE TYPE "public"."results_status_enum" AS ENUM('FINISHED','DNF','DNS','DQ')`,
    );

    await queryRunner.query(`
      CREATE TABLE "results" (
        "id"                  uuid    NOT NULL DEFAULT uuid_generate_v4(),
        "participant_id"      uuid    NOT NULL,
        "sport_event_id"      uuid    NOT NULL,
        "sub_event_id"        uuid    NOT NULL,
        "position"            integer,
        "finish_time_seconds" integer,
        "bib_number"          integer,
        "status"              "public"."results_status_enum" NOT NULL DEFAULT 'FINISHED',
        "category"            varchar,
        "category_position"   integer,
        "notes"               text,
        "createdAt"           TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"           TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_results" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "results"
        ADD CONSTRAINT "FK_results_participant"
          FOREIGN KEY ("participant_id") REFERENCES "user"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "FK_results_sport_event"
          FOREIGN KEY ("sport_event_id") REFERENCES "sport_events"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "FK_results_sub_event"
          FOREIGN KEY ("sub_event_id") REFERENCES "sport_sub_events"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "results"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."results_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."payments_method_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."payments_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_registrations_participant_sub_event"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "registrations"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."registrations_status_enum"`,
    );
  }
}
