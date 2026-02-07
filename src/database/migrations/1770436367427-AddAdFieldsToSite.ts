import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdFieldsToSite1770436367427 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sites"
      ADD COLUMN "ad_provider" varchar(20) NULL,
      ADD COLUMN "ad_mobile_header" varchar(100) NULL,
      ADD COLUMN "ad_pc_sidebar" varchar(100) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sites"
      DROP COLUMN "ad_pc_sidebar",
      DROP COLUMN "ad_mobile_header",
      DROP COLUMN "ad_provider"
    `);
  }
}
