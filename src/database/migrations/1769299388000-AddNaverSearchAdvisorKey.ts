import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNaverSearchAdvisorKey1769299388000 implements MigrationInterface {
  name = 'AddNaverSearchAdvisorKey1769299388000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sites"
      ADD COLUMN "naver_search_advisor_key" varchar(255) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sites"
      DROP COLUMN "naver_search_advisor_key"
    `);
  }
}
