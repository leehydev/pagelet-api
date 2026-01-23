import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveCanonicalBaseUrlFromSites1769144394000 implements MigrationInterface {
  name = 'RemoveCanonicalBaseUrlFromSites1769144394000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN IF EXISTS "canonical_base_url"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sites" ADD "canonical_base_url" character varying(500)`);
  }
}
