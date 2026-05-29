import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1780052056938 implements MigrationInterface {
  name = 'AutoMigration1780052056938';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "company" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, "website" character varying, "email" character varying, "phone" character varying, "logoUrl" character varying, "bannerUrl" character varying, "country" character varying, "city" character varying, "address" character varying, "sportType" character varying, "companyType" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_47216baa0f0c8ebc6ee5a74989c" UNIQUE ("slug"), CONSTRAINT "PK_056f7854a7afdba7cbd6d45fc20" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_role_enum" AS ENUM('PARTICIPANT', 'COMPANY_STAFF', 'COMPANY_ADMIN', 'SUPER_ADMIN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "role" "public"."user_role_enum" NOT NULL DEFAULT 'PARTICIPANT'`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "companyId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_86586021a26d1180b0968f98502" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_86586021a26d1180b0968f98502"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "companyId"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    await queryRunner.query(`DROP TABLE "company"`);
  }
}
