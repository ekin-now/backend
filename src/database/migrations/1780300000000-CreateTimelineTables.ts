import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTimelineTables1780300000000 implements MigrationInterface {
  name = 'CreateTimelineTables1780300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "follows" (
        "follower_id" uuid NOT NULL,
        "following_id" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_follows" PRIMARY KEY ("follower_id", "following_id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows"
        ADD CONSTRAINT "FK_follows_follower" FOREIGN KEY ("follower_id") REFERENCES "user"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "FK_follows_following" FOREIGN KEY ("following_id") REFERENCES "user"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."posts_type_enum" AS ENUM('TEXT', 'IMAGE', 'EVENT_REF', 'ACTIVITY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "posts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "text" text NOT NULL,
        "imageUrl" character varying,
        "type" "public"."posts_type_enum" NOT NULL DEFAULT 'TEXT',
        "activityData" jsonb,
        "sport_event_id" uuid,
        "user_id" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_posts" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts"
        ADD CONSTRAINT "FK_posts_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "FK_posts_sport_event" FOREIGN KEY ("sport_event_id") REFERENCES "sport_events"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_posts_user_created" ON "posts" ("user_id", "createdAt" DESC)`,
    );

    await queryRunner.query(
      `CREATE TABLE "post_comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "text" text NOT NULL,
        "post_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_post_comments" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_comments"
        ADD CONSTRAINT "FK_post_comments_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "FK_post_comments_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `CREATE TABLE "post_likes" (
        "user_id" uuid NOT NULL,
        "post_id" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_post_likes" PRIMARY KEY ("user_id", "post_id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_likes"
        ADD CONSTRAINT "FK_post_likes_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "FK_post_likes_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_likes" DROP CONSTRAINT "FK_post_likes_post"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_likes" DROP CONSTRAINT "FK_post_likes_user"`,
    );
    await queryRunner.query(`DROP TABLE "post_likes"`);

    await queryRunner.query(
      `ALTER TABLE "post_comments" DROP CONSTRAINT "FK_post_comments_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_comments" DROP CONSTRAINT "FK_post_comments_post"`,
    );
    await queryRunner.query(`DROP TABLE "post_comments"`);

    await queryRunner.query(`DROP INDEX "IDX_posts_user_created"`);
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_posts_sport_event"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_posts_user"`,
    );
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`DROP TYPE "public"."posts_type_enum"`);

    await queryRunner.query(
      `ALTER TABLE "follows" DROP CONSTRAINT "FK_follows_following"`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" DROP CONSTRAINT "FK_follows_follower"`,
    );
    await queryRunner.query(`DROP TABLE "follows"`);
  }
}
