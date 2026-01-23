import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAnalyticsTables1769150611000 implements MigrationInterface {
  name = 'CreateAnalyticsTables1769150611000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // page_views 테이블 생성
    await queryRunner.query(`
      CREATE TABLE "page_views" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "site_id" uuid NOT NULL,
        "post_id" uuid,
        "visitor_id" character varying(64) NOT NULL,
        "viewed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_page_views" PRIMARY KEY ("id")
      )
    `);

    // page_views 외래키
    await queryRunner.query(`
      ALTER TABLE "page_views"
      ADD CONSTRAINT "FK_page_views_site"
      FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // page_views 인덱스
    await queryRunner.query(`
      CREATE INDEX "IDX_page_views_site_viewed_at" ON "page_views" ("site_id", "viewed_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_page_views_post_viewed_at" ON "page_views" ("post_id", "viewed_at")
    `);

    // cta_clicks 테이블 생성
    await queryRunner.query(`
      CREATE TABLE "cta_clicks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "site_id" uuid NOT NULL,
        "post_id" uuid,
        "visitor_id" character varying(64) NOT NULL,
        "clicked_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cta_clicks" PRIMARY KEY ("id")
      )
    `);

    // cta_clicks 외래키
    await queryRunner.query(`
      ALTER TABLE "cta_clicks"
      ADD CONSTRAINT "FK_cta_clicks_site"
      FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // cta_clicks 인덱스
    await queryRunner.query(`
      CREATE INDEX "IDX_cta_clicks_site_clicked_at" ON "cta_clicks" ("site_id", "clicked_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // cta_clicks 인덱스 삭제
    await queryRunner.query(`DROP INDEX "IDX_cta_clicks_site_clicked_at"`);

    // cta_clicks 외래키 삭제
    await queryRunner.query(`ALTER TABLE "cta_clicks" DROP CONSTRAINT "FK_cta_clicks_site"`);

    // cta_clicks 테이블 삭제
    await queryRunner.query(`DROP TABLE "cta_clicks"`);

    // page_views 인덱스 삭제
    await queryRunner.query(`DROP INDEX "IDX_page_views_post_viewed_at"`);
    await queryRunner.query(`DROP INDEX "IDX_page_views_site_viewed_at"`);

    // page_views 외래키 삭제
    await queryRunner.query(`ALTER TABLE "page_views" DROP CONSTRAINT "FK_page_views_site"`);

    // page_views 테이블 삭제
    await queryRunner.query(`DROP TABLE "page_views"`);
  }
}
