import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccountStatusAndOnboardingStep1768893937060 implements MigrationInterface {
    name = 'AddAccountStatusAndOnboardingStep1768893937060'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "slug" character varying(100) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4f5eccb1dfde10c9170502595a7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_26503a75e987672fb5af9258cc" ON "sites" ("slug") `);
        await queryRunner.query(`CREATE TABLE "posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "site_id" uuid NOT NULL, "title" character varying(500) NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "account_status" character varying(20) NOT NULL DEFAULT 'ONBOARDING'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "onboarding_step" integer`);
        await queryRunner.query(`DROP INDEX "pagelet"."IDX_4508a993f9340ca4e7547db4ff"`);
        await queryRunner.query(`ALTER TABLE "social_accounts" DROP COLUMN "provider"`);
        await queryRunner.query(`CREATE TYPE "pagelet"."social_accounts_provider_enum" AS ENUM('KAKAO')`);
        await queryRunner.query(`ALTER TABLE "social_accounts" ADD "provider" "pagelet"."social_accounts_provider_enum" NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4508a993f9340ca4e7547db4ff" ON "social_accounts" ("provider", "provider_user_id") `);
        await queryRunner.query(`ALTER TABLE "sites" ADD CONSTRAINT "FK_24c21d04fcce0511d6c52ed9659" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_c4f9a7bd77b489e711277ee5986" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_eb84ec16b52b3ff2ad794b33bc9" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_eb84ec16b52b3ff2ad794b33bc9"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_c4f9a7bd77b489e711277ee5986"`);
        await queryRunner.query(`ALTER TABLE "sites" DROP CONSTRAINT "FK_24c21d04fcce0511d6c52ed9659"`);
        await queryRunner.query(`DROP INDEX "pagelet"."IDX_4508a993f9340ca4e7547db4ff"`);
        await queryRunner.query(`ALTER TABLE "social_accounts" DROP COLUMN "provider"`);
        await queryRunner.query(`DROP TYPE "pagelet"."social_accounts_provider_enum"`);
        await queryRunner.query(`ALTER TABLE "social_accounts" ADD "provider" social_accounts_provider_enum NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4508a993f9340ca4e7547db4ff" ON "social_accounts" ("provider", "provider_user_id") `);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "onboarding_step"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "account_status"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP INDEX "pagelet"."IDX_26503a75e987672fb5af9258cc"`);
        await queryRunner.query(`DROP TABLE "sites"`);
    }

}
