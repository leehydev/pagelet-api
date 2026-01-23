import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSiteBannersTable1737600000000 implements MigrationInterface {
  name = 'AddSiteBannersTable1737600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // site_banners 테이블 생성
    await queryRunner.query(`
      CREATE TABLE "site_banners" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "site_id" uuid NOT NULL,
        "image_url" character varying(500) NOT NULL,
        "link_url" character varying(500),
        "open_in_new_tab" boolean NOT NULL DEFAULT true,
        "is_active" boolean NOT NULL DEFAULT true,
        "start_at" TIMESTAMP WITH TIME ZONE,
        "end_at" TIMESTAMP WITH TIME ZONE,
        "display_order" integer NOT NULL DEFAULT 0,
        "alt_text" character varying(255),
        "device_type" character varying(20) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_site_banners" PRIMARY KEY ("id")
      )
    `);

    // site_id 인덱스 생성
    await queryRunner.query(`
      CREATE INDEX "IDX_site_banners_site_id" ON "site_banners" ("site_id")
    `);

    // (site_id, device_type) 복합 인덱스 생성
    await queryRunner.query(`
      CREATE INDEX "IDX_site_banners_site_device" ON "site_banners" ("site_id", "device_type")
    `);

    // site_id 외래키 제약조건 추가
    await queryRunner.query(`
      ALTER TABLE "site_banners"
      ADD CONSTRAINT "FK_site_banners_site"
      FOREIGN KEY ("site_id")
      REFERENCES "sites"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 외래키 제약조건 제거
    await queryRunner.query(`
      ALTER TABLE "site_banners"
      DROP CONSTRAINT "FK_site_banners_site"
    `);

    // 인덱스 제거
    await queryRunner.query(`
      DROP INDEX "IDX_site_banners_site_device"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_site_banners_site_id"
    `);

    // 테이블 제거
    await queryRunner.query(`
      DROP TABLE "site_banners"
    `);
  }
}
