import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileFieldsToUser1780050120055 implements MigrationInterface {
  name = 'AddProfileFieldsToUser1780050120055';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "gender" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "country" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "city" character varying`);
    await queryRunner.query(`ALTER TABLE "user" ADD "bio" character varying`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "instagram" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "strava" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "strava"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "instagram"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bio"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "city"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "country"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "gender"`);
  }
}
