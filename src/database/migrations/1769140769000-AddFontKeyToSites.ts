import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFontKeyToSites1769140769000 implements MigrationInterface {
  name = 'AddFontKeyToSites1769140769000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sites" ADD "font_key" character varying(20)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "font_key"`);
  }
}
