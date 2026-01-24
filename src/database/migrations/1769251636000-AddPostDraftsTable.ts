import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostDraftsTable1769251636000 implements MigrationInterface {
  name = 'AddPostDraftsTable1769251636000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // post_drafts 테이블 생성
    await queryRunner.query(`
      CREATE TABLE "post_drafts" (
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

    // post_id 외래키 제약조건 추가
    await queryRunner.query(`
      ALTER TABLE "post_drafts"
      ADD CONSTRAINT "FK_post_drafts_post"
      FOREIGN KEY ("post_id")
      REFERENCES "posts"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // category_id 외래키 제약조건 추가
    await queryRunner.query(`
      ALTER TABLE "post_drafts"
      ADD CONSTRAINT "FK_post_drafts_category"
      FOREIGN KEY ("category_id")
      REFERENCES "categories"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // category_id 외래키 제약조건 제거
    await queryRunner.query(`
      ALTER TABLE "post_drafts"
      DROP CONSTRAINT "FK_post_drafts_category"
    `);

    // post_id 외래키 제약조건 제거
    await queryRunner.query(`
      ALTER TABLE "post_drafts"
      DROP CONSTRAINT "FK_post_drafts_post"
    `);

    // post_drafts 테이블 제거
    await queryRunner.query(`
      DROP TABLE "post_drafts"
    `);
  }
}
