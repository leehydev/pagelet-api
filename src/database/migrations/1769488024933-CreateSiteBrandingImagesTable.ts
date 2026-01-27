import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSiteBrandingImagesTable1769488024933 implements MigrationInterface {
    name = 'CreateSiteBrandingImagesTable1769488024933'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "site_branding_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "site_id" uuid NOT NULL, "type" character varying(20) NOT NULL, "s3_key" character varying(500) NOT NULL, "is_active" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4ca1d2e40fb66e045ebf5778641" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fedf4ba3434e4ebfe276cdd023" ON "site_branding_images" ("site_id", "type") `);
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "logo_image_url"`);
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "favicon_url"`);
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "og_image_url"`);
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "cta_image_url"`);
        await queryRunner.query(`ALTER TABLE "site_branding_images" ADD CONSTRAINT "FK_2b33489176a18f806647213b9d8" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "site_branding_images" DROP CONSTRAINT "FK_2b33489176a18f806647213b9d8"`);
        await queryRunner.query(`ALTER TABLE "sites" ADD "cta_image_url" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "sites" ADD "og_image_url" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "sites" ADD "favicon_url" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "sites" ADD "logo_image_url" character varying(500)`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fedf4ba3434e4ebfe276cdd023"`);
        await queryRunner.query(`DROP TABLE "site_branding_images"`);
    }

}
