import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1780257883970 implements MigrationInterface {
  name = 'AutoMigration1780257883970';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."sport_events_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "sport_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "shortDescription" character varying(500) NOT NULL, "description" text NOT NULL, "sportType" character varying NOT NULL, "status" "public"."sport_events_status_enum" NOT NULL DEFAULT 'DRAFT', "eventDate" TIMESTAMP NOT NULL, "registrationOpenAt" TIMESTAMP, "registrationCloseAt" TIMESTAMP, "country" character varying NOT NULL, "region" character varying NOT NULL, "city" character varying NOT NULL, "address" character varying, "latitude" numeric(10,7), "longitude" numeric(10,7), "bannerUrl" character varying, "logoUrl" character varying, "websiteUrl" character varying, "rulesDocumentUrl" character varying, "featured" boolean NOT NULL DEFAULT false, "companyId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "company_id" uuid, CONSTRAINT "UQ_200a5dc4c4f8207ba6605b8d015" UNIQUE ("slug"), CONSTRAINT "PK_52a72ab634a9485e502a4b60394" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."sport_sub_events_status_enum" AS ENUM('DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "sport_sub_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sportEventId" character varying NOT NULL, "name" character varying NOT NULL, "shortDescription" character varying(500) NOT NULL, "description" text NOT NULL, "status" "public"."sport_sub_events_status_enum" NOT NULL DEFAULT 'DRAFT', "distanceKm" numeric(8,3), "elevationGainMeters" integer, "capacity" integer NOT NULL DEFAULT '0', "registeredParticipants" integer NOT NULL DEFAULT '0', "price" numeric(10,2) NOT NULL DEFAULT '0', "currency" character varying NOT NULL DEFAULT 'EUR', "startDateTime" TIMESTAMP NOT NULL, "timeLimitMinutes" integer, "minimumAge" integer, "maximumAge" integer, "gpxUrl" character varying, "coverImageUrl" character varying, "bibNumberRequired" boolean NOT NULL DEFAULT false, "bibStartNumber" integer, "bibEndNumber" integer, "registrationOpenAt" TIMESTAMP, "registrationCloseAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "sport_event_id" uuid, CONSTRAINT "PK_a38e80d549552bbb0feeceda2f0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "sport_events" ADD CONSTRAINT "FK_d4c140a2ad9ef266998d430ffe8" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sport_sub_events" ADD CONSTRAINT "FK_7d3cfab62c561e0c3909c99c99b" FOREIGN KEY ("sport_event_id") REFERENCES "sport_events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sport_sub_events" DROP CONSTRAINT "FK_7d3cfab62c561e0c3909c99c99b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sport_events" DROP CONSTRAINT "FK_d4c140a2ad9ef266998d430ffe8"`,
    );
    await queryRunner.query(`DROP TABLE "sport_sub_events"`);
    await queryRunner.query(
      `DROP TYPE "public"."sport_sub_events_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "sport_events"`);
    await queryRunner.query(`DROP TYPE "public"."sport_events_status_enum"`);
  }
}
