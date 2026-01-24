import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSlugToPostDrafts1769270000000 implements MigrationInterface {
  name = 'AddSlugToPostDrafts1769270000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // slug 컬럼 추가 (nullable로 먼저 추가)
    await queryRunner.query(`
      ALTER TABLE "post_drafts"
      ADD COLUMN IF NOT EXISTS "slug" character varying(255)
    `);

    // 기존 드래프트에 대해 posts 테이블에서 slug 값 복사
    await queryRunner.query(`
      UPDATE "post_drafts" pd
      SET "slug" = p."slug"
      FROM "posts" p
      WHERE pd."post_id" = p."id"
      AND pd."slug" IS NULL
    `);

    // NOT NULL 제약조건 추가
    await queryRunner.query(`
      ALTER TABLE "post_drafts"
      ALTER COLUMN "slug" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "post_drafts"
      DROP COLUMN IF EXISTS "slug"
    `);
  }
}
