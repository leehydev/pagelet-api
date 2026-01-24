import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostDraftsTable1769251636000 implements MigrationInterface {
  name = 'AddPostDraftsTable1769251636000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // post_drafts 테이블 생성
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "post_drafts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "post_id" uuid NOT NULL,
        "title" character varying(500) NOT NULL,
        "subtitle" character varying(500) NOT NULL,
        "content_json" jsonb,
        "content_html" text,
        "content_text" text,
        "seo_title" character varying(255),
        "seo_description" character varying(500),
        "og_image_url" character varying(500),
        "category_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_post_drafts" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_post_drafts_post_id" UNIQUE ("post_id")
      )
    `);

    // post_id 외래키 제약조건 추가 (존재하지 않는 경우에만)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_post_drafts_post'
        ) THEN
          ALTER TABLE "post_drafts"
          ADD CONSTRAINT "FK_post_drafts_post"
          FOREIGN KEY ("post_id")
          REFERENCES "posts"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    // category_id 외래키 제약조건 추가 (존재하지 않는 경우에만)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_post_drafts_category'
        ) THEN
          ALTER TABLE "post_drafts"
          ADD CONSTRAINT "FK_post_drafts_category"
          FOREIGN KEY ("category_id")
          REFERENCES "categories"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // category_id 외래키 제약조건 제거
    await queryRunner.query(`
      ALTER TABLE "post_drafts"
      DROP CONSTRAINT IF EXISTS "FK_post_drafts_category"
    `);

    // post_id 외래키 제약조건 제거
    await queryRunner.query(`
      ALTER TABLE "post_drafts"
      DROP CONSTRAINT IF EXISTS "FK_post_drafts_post"
    `);

    // post_drafts 테이블 제거
    await queryRunner.query(`
      DROP TABLE IF EXISTS "post_drafts"
    `);
  }
}
