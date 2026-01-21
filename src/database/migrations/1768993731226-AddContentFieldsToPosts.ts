import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContentFieldsToPosts1768993731226 implements MigrationInterface {
  name = 'AddContentFieldsToPosts1768993731226';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // content 필드를 nullable로 변경 (하위 호환성 유지)
    await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "content" DROP NOT NULL`);

    // content_json 필드 추가 (jsonb, nullable)
    await queryRunner.query(`ALTER TABLE "posts" ADD "contentJson" jsonb`);

    // content_html 필드 추가 (text, nullable)
    await queryRunner.query(`ALTER TABLE "posts" ADD "contentHtml" text`);

    // content_text 필드 추가 (text, nullable)
    await queryRunner.query(`ALTER TABLE "posts" ADD "contentText" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 새로 추가한 필드들 제거
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "contentText"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "contentHtml"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "contentJson"`);

    // content 필드를 다시 NOT NULL로 변경
    await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "content" SET NOT NULL`);
  }
}
