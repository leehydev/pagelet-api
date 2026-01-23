import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubtitleToPosts1768976904921 implements MigrationInterface {
  name = 'AddSubtitleToPosts1768976904921';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 기존 데이터가 있을 수 있으므로 먼저 nullable로 추가
    await queryRunner.query(`ALTER TABLE "posts" ADD "subtitle" character varying(500)`);

    // 기존 데이터의 subtitle을 title과 동일하게 설정 (또는 빈 문자열)
    await queryRunner.query(`UPDATE "posts" SET "subtitle" = "title" WHERE "subtitle" IS NULL`);

    // NOT NULL 제약조건 추가
    await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "subtitle" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "subtitle"`);
  }
}
