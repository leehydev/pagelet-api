import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStorageTables1768912866458 implements MigrationInterface {
  name = 'AddStorageTables1768912866458';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "site_storage_usage" ("site_id" uuid NOT NULL, "used_bytes" bigint NOT NULL DEFAULT '0', "reserved_bytes" bigint NOT NULL DEFAULT '0', "max_bytes" bigint NOT NULL DEFAULT '1073741824', CONSTRAINT "PK_08e1073e29f5c5d8841d555ec35" PRIMARY KEY ("site_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "site_id" uuid NOT NULL, "post_id" uuid, "s3_key" character varying(500) NOT NULL, "size_bytes" bigint NOT NULL, "mime_type" character varying(100) NOT NULL, "image_type" character varying(50) NOT NULL DEFAULT 'THUMBNAIL', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_32fe67d8cdea0e7536320d7c454" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`DROP INDEX "pagelet"."IDX_4508a993f9340ca4e7547db4ff"`);
    // provider 컬럼 타입 변경 (enum -> varchar): 데이터 유실 방지를 위해 USING 절 사용
    await queryRunner.query(
      `ALTER TABLE "social_accounts" ALTER COLUMN "provider" TYPE character varying(50) USING "provider"::text`,
    );
    await queryRunner.query(`DROP TYPE "pagelet"."social_accounts_provider_enum"`);
    await queryRunner.query(
      `ALTER TABLE "sites" ALTER COLUMN "seo_title" TYPE character varying(120)`,
    );
    // posts.status 컬럼 타입 변경 (enum -> varchar): 데이터 유실 방지를 위해 USING 절 사용
    await queryRunner.query(
      `ALTER TABLE "posts" ALTER COLUMN "status" TYPE character varying(50) USING "status"::text`,
    );
    await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`);
    await queryRunner.query(`DROP TYPE "pagelet"."posts_status_enum"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4508a993f9340ca4e7547db4ff" ON "social_accounts" ("provider", "provider_user_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "pagelet"."IDX_4508a993f9340ca4e7547db4ff"`);
    // posts.status 컬럼 타입 변경 (varchar -> enum): 데이터 유실 방지를 위해 USING 절 사용
    await queryRunner.query(
      `CREATE TYPE "pagelet"."posts_status_enum" AS ENUM('DRAFT', 'PUBLISHED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ALTER COLUMN "status" TYPE "pagelet"."posts_status_enum" USING "status"::"pagelet"."posts_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`);
    await queryRunner.query(
      `ALTER TABLE "sites" ALTER COLUMN "seo_title" TYPE character varying(100)`,
    );
    // provider 컬럼 타입 변경 (varchar -> enum): 데이터 유실 방지를 위해 USING 절 사용
    await queryRunner.query(
      `CREATE TYPE "pagelet"."social_accounts_provider_enum" AS ENUM('KAKAO')`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_accounts" ALTER COLUMN "provider" TYPE "pagelet"."social_accounts_provider_enum" USING "provider"::"pagelet"."social_accounts_provider_enum"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4508a993f9340ca4e7547db4ff" ON "social_accounts" ("provider", "provider_user_id") `,
    );
    await queryRunner.query(`DROP TABLE "post_images"`);
    await queryRunner.query(`DROP TABLE "site_storage_usage"`);
  }
}
