import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSeoFieldsToPosts1768903416984 implements MigrationInterface {
  name = 'AddSeoFieldsToPosts1768903416984';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "slug" character varying(255) NOT NULL DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `CREATE TYPE "pagelet"."posts_status_enum" AS ENUM('DRAFT', 'PUBLISHED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "status" "pagelet"."posts_status_enum" NOT NULL DEFAULT 'DRAFT'`,
    );
    await queryRunner.query(`ALTER TABLE "posts" ADD "published_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "seo_title" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "seo_description" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "og_image_url" character varying(500)`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_efbdb19c538fd8fb5e3752345d" ON "posts" ("site_id", "slug") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "pagelet"."IDX_efbdb19c538fd8fb5e3752345d"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "og_image_url"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "seo_description"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "seo_title"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "published_at"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "pagelet"."posts_status_enum"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "slug"`);
  }
}
