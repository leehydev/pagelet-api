import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexedAtToPost1769530000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts'`,
    );
    if (!hasTable?.length) return;

    const hasColumn = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'indexed_at'`,
    );
    if (hasColumn?.length) return;

    await queryRunner.query(`ALTER TABLE "posts" ADD "indexed_at" TIMESTAMPTZ`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'indexed_at'`,
    );
    if (!hasColumn?.length) return;

    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "indexed_at"`);
  }
}
