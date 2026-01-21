import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoriesTable1768960000000 implements MigrationInterface {
  name = 'AddCategoriesTable1768960000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // categories 테이블 생성
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "site_id" uuid NOT NULL,
        "slug" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )
    `);

    // (site_id, slug) 유니크 인덱스 생성
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_categories_site_slug" ON "categories" ("site_id", "slug")
    `);

    // site_id 외래키 제약조건 추가
    await queryRunner.query(`
      ALTER TABLE "categories" 
      ADD CONSTRAINT "FK_categories_site" 
      FOREIGN KEY ("site_id") 
      REFERENCES "sites"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    // posts 테이블에 category_id 컬럼 추가
    await queryRunner.query(`
      ALTER TABLE "posts" 
      ADD "category_id" uuid
    `);

    // category_id 외래키 제약조건 추가
    await queryRunner.query(`
      ALTER TABLE "posts" 
      ADD CONSTRAINT "FK_posts_category" 
      FOREIGN KEY ("category_id") 
      REFERENCES "categories"("id") 
      ON DELETE SET NULL 
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // posts 테이블의 category_id 외래키 제약조건 제거
    await queryRunner.query(`
      ALTER TABLE "posts" 
      DROP CONSTRAINT "FK_posts_category"
    `);

    // posts 테이블의 category_id 컬럼 제거
    await queryRunner.query(`
      ALTER TABLE "posts" 
      DROP COLUMN "category_id"
    `);

    // categories 테이블의 site_id 외래키 제약조건 제거
    await queryRunner.query(`
      ALTER TABLE "categories" 
      DROP CONSTRAINT "FK_categories_site"
    `);

    // categories 테이블의 인덱스 제거
    await queryRunner.query(`
      DROP INDEX "IDX_categories_site_slug"
    `);

    // categories 테이블 제거
    await queryRunner.query(`
      DROP TABLE "categories"
    `);
  }
}
