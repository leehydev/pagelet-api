import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettingFieldsToSites1768907018985 implements MigrationInterface {
  name = 'AddSettingFieldsToSites1768907018985';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sites" ADD "logo_image_url" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "sites" ADD "favicon_url" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "sites" ADD "og_image_url" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "sites" ADD "seo_title" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "sites" ADD "seo_description" text`);
    await queryRunner.query(`ALTER TABLE "sites" ADD "seo_keywords" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "sites" ADD "canonical_base_url" character varying(500)`);
    await queryRunner.query(
      `ALTER TABLE "sites" ADD "robots_index" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "sites" ADD "contact_email" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "sites" ADD "contact_phone" character varying(50)`);
    await queryRunner.query(`ALTER TABLE "sites" ADD "address" text`);
    await queryRunner.query(`ALTER TABLE "sites" ADD "kakao_channel_url" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "sites" ADD "naver_map_url" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "sites" ADD "instagram_url" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "sites" ADD "business_number" character varying(20)`);
    await queryRunner.query(`ALTER TABLE "sites" ADD "business_name" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "sites" ADD "representative_name" character varying(50)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "representative_name"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "business_name"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "business_number"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "instagram_url"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "naver_map_url"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "kakao_channel_url"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "address"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "contact_phone"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "contact_email"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "robots_index"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "canonical_base_url"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "seo_keywords"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "seo_description"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "seo_title"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "og_image_url"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "favicon_url"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "logo_image_url"`);
  }
}
