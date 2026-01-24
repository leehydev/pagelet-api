import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSystemSettingsTable1769260128000 implements MigrationInterface {
  name = 'CreateSystemSettingsTable1769260128000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // system_settings 테이블 생성
    await queryRunner.query(`
      CREATE TABLE "system_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key" character varying(100) NOT NULL,
        "value" character varying(500) NOT NULL,
        "description" character varying(500),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_system_settings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_system_settings_key" UNIQUE ("key")
      )
    `);

    // 초기 데이터 시딩: registration_mode 설정
    await queryRunner.query(`
      INSERT INTO "system_settings" ("key", "value", "description")
      VALUES (
        'registration_mode',
        'PENDING',
        '회원가입 승인 모드: PENDING(관리자 승인 필요), ACTIVE(즉시 활성화)'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // system_settings 테이블 삭제
    await queryRunner.query(`
      DROP TABLE "system_settings"
    `);
  }
}
