import { MigrationInterface, QueryRunner } from 'typeorm';

export class SimplifyPostDrafts1769529871000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 기존 post_drafts 테이블 삭제 (데이터 마이그레이션 없이 새로 시작)
    await queryRunner.query(`DROP TABLE IF EXISTS "post_drafts" CASCADE`);

    // 2. 새 post_drafts 테이블 생성 (postId 없음, siteId/userId/expiresAt 추가)
    await queryRunner.query(`
      CREATE TABLE "post_drafts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "site_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "title" varchar(500) NOT NULL DEFAULT '',
        "subtitle" varchar(500) NOT NULL DEFAULT '',
        "slug" varchar(255),
        "content_json" jsonb,
        "content_html" text,
        "content_text" text,
        "seo_title" varchar(255),
        "seo_description" varchar(500),
        "og_image_url" varchar(500),
        "category_id" uuid,
        "expires_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_post_drafts" PRIMARY KEY ("id")
      )
    `);

    // 3. 외래키 제약조건 추가
    await queryRunner.query(`
      ALTER TABLE "post_drafts"
      ADD CONSTRAINT "FK_post_drafts_site"
      FOREIGN KEY ("site_id") REFERENCES "sites"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "post_drafts"
      ADD CONSTRAINT "FK_post_drafts_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "post_drafts"
      ADD CONSTRAINT "FK_post_drafts_category"
      FOREIGN KEY ("category_id") REFERENCES "categories"("id")
      ON DELETE SET NULL
    `);

    // 4. 인덱스 생성
    await queryRunner.query(`
      CREATE INDEX "IX_post_drafts_site_user" ON "post_drafts" ("site_id", "user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IX_post_drafts_expires_at" ON "post_drafts" ("expires_at")
    `);

    // 5. draft_images 테이블 생성
    await queryRunner.query(`
      CREATE TABLE "draft_images" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "draft_id" uuid NOT NULL,
        "site_id" uuid NOT NULL,
        "s3_key" varchar(500) NOT NULL,
        "size_bytes" bigint NOT NULL DEFAULT 0,
        "mime_type" varchar(100) NOT NULL,
        "image_type" varchar(50) NOT NULL DEFAULT 'CONTENT',
        "pending_delete" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_draft_images" PRIMARY KEY ("id")
      )
    `);

    // 6. draft_images 외래키 제약조건
    await queryRunner.query(`
      ALTER TABLE "draft_images"
      ADD CONSTRAINT "FK_draft_images_draft"
      FOREIGN KEY ("draft_id") REFERENCES "post_drafts"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "draft_images"
      ADD CONSTRAINT "FK_draft_images_site"
      FOREIGN KEY ("site_id") REFERENCES "sites"("id")
      ON DELETE CASCADE
    `);

    // 7. draft_images 인덱스
    await queryRunner.query(`
      CREATE INDEX "IX_draft_images_draft_id" ON "draft_images" ("draft_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IX_draft_images_pending_delete" ON "draft_images" ("pending_delete")
      WHERE "pending_delete" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. draft_images 테이블 삭제
    await queryRunner.query(`DROP TABLE IF EXISTS "draft_images" CASCADE`);

    // 2. 새 post_drafts 테이블 삭제
    await queryRunner.query(`DROP TABLE IF EXISTS "post_drafts" CASCADE`);

    // 3. 기존 post_drafts 테이블 복원 (postId 기반)
    await queryRunner.query(`
      CREATE TABLE "post_drafts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "post_id" uuid NOT NULL,
        "title" varchar(500) NOT NULL,
        "subtitle" varchar(500) NOT NULL,
        "slug" varchar(255) NOT NULL,
        "content_json" jsonb,
        "content_html" text,
        "content_text" text,
        "seo_title" varchar(255),
        "seo_description" varchar(500),
        "og_image_url" varchar(500),
        "category_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_post_drafts" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_post_drafts_post_id" UNIQUE ("post_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "post_drafts"
      ADD CONSTRAINT "FK_post_drafts_post"
      FOREIGN KEY ("post_id") REFERENCES "posts"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "post_drafts"
      ADD CONSTRAINT "FK_post_drafts_category"
      FOREIGN KEY ("category_id") REFERENCES "categories"("id")
      ON DELETE SET NULL
    `);
  }
}
