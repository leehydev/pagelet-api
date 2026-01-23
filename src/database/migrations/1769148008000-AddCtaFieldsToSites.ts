import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCtaFieldsToSites1769148008000 implements MigrationInterface {
  name = 'AddCtaFieldsToSites1769148008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sites" ADD "cta_enabled" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "sites" ADD "cta_type" character varying(20)`);
    await queryRunner.query(`ALTER TABLE "sites" ADD "cta_text" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "sites" ADD "cta_image_url" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "sites" ADD "cta_link" character varying(500)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "cta_link"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "cta_image_url"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "cta_text"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "cta_type"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "cta_enabled"`);
  }
}
