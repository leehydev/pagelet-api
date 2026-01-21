import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixContentFieldsColumnNames1768994374187 implements MigrationInterface {
  name = 'FixContentFieldsColumnNames1768994374187';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // camelCase 컬럼명을 snake_case로 변경
    // contentJson -> content_json
    await queryRunner.query(`
      ALTER TABLE "posts" 
      RENAME COLUMN "contentJson" TO "content_json"
    `);

    // contentHtml -> content_html
    await queryRunner.query(`
      ALTER TABLE "posts" 
      RENAME COLUMN "contentHtml" TO "content_html"
    `);

    // contentText -> content_text
    await queryRunner.query(`
      ALTER TABLE "posts" 
      RENAME COLUMN "contentText" TO "content_text"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // snake_case 컬럼명을 camelCase로 되돌림
    await queryRunner.query(`
      ALTER TABLE "posts" 
      RENAME COLUMN "content_text" TO "contentText"
    `);

    await queryRunner.query(`
      ALTER TABLE "posts" 
      RENAME COLUMN "content_html" TO "contentHtml"
    `);

    await queryRunner.query(`
      ALTER TABLE "posts" 
      RENAME COLUMN "content_json" TO "contentJson"
    `);
  }
}
