import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1769482970823 implements MigrationInterface {
    name = 'InitialSchema1769482970823'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "site_storage_usage" ("site_id" uuid NOT NULL, "used_bytes" bigint NOT NULL DEFAULT '0', "reserved_bytes" bigint NOT NULL DEFAULT '0', "max_bytes" bigint NOT NULL DEFAULT '1073741824', CONSTRAINT "PK_08e1073e29f5c5d8841d555ec35" PRIMARY KEY ("site_id"))`);
        await queryRunner.query(`CREATE TABLE "post_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "site_id" uuid NOT NULL, "post_id" uuid, "s3_key" character varying(500) NOT NULL, "size_bytes" bigint NOT NULL, "mime_type" character varying(100) NOT NULL, "image_type" character varying(50) NOT NULL DEFAULT 'THUMBNAIL', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_32fe67d8cdea0e7536320d7c454" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "social_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "provider" character varying(50) NOT NULL, "provider_user_id" character varying(255) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "connected_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e9e58d2d8e9fafa20af914d9750" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4508a993f9340ca4e7547db4ff" ON "social_accounts" ("provider", "provider_user_id") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255), "name" character varying(255), "account_status" character varying(20) NOT NULL DEFAULT 'ONBOARDING', "onboarding_step" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "slug" character varying(100) NOT NULL, "logo_image_url" character varying(500), "favicon_url" character varying(500), "og_image_url" character varying(500), "seo_title" character varying(120), "seo_description" text, "seo_keywords" character varying(500), "robots_index" boolean NOT NULL DEFAULT false, "contact_email" character varying(255), "contact_phone" character varying(50), "address" text, "kakao_channel_url" character varying(500), "naver_map_url" character varying(500), "instagram_url" character varying(500), "business_number" character varying(20), "business_name" character varying(100), "representative_name" character varying(50), "font_key" character varying(20), "naver_search_advisor_key" character varying(255), "cta_enabled" boolean NOT NULL DEFAULT false, "cta_type" character varying(20), "cta_text" character varying(100), "cta_image_url" character varying(500), "cta_link" character varying(500), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4f5eccb1dfde10c9170502595a7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_26503a75e987672fb5af9258cc" ON "sites" ("slug") `);
        await queryRunner.query(`CREATE TABLE "posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "site_id" uuid NOT NULL, "title" character varying(500) NOT NULL, "subtitle" character varying(500) NOT NULL, "slug" character varying(255) NOT NULL DEFAULT gen_random_uuid(), "content" text, "content_json" jsonb, "content_html" text, "content_text" text, "status" character varying(50) NOT NULL DEFAULT 'PRIVATE', "published_at" TIMESTAMP WITH TIME ZONE, "seo_title" character varying(255), "seo_description" character varying(500), "og_image_url" character varying(500), "category_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_efbdb19c538fd8fb5e3752345d" ON "posts" ("site_id", "slug") `);
        await queryRunner.query(`CREATE TABLE "post_drafts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "post_id" uuid NOT NULL, "title" character varying(500) NOT NULL, "subtitle" character varying(500) NOT NULL, "slug" character varying(255) NOT NULL, "content_json" jsonb, "content_html" text, "content_text" text, "seo_title" character varying(255), "seo_description" character varying(500), "og_image_url" character varying(500), "category_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_22504e046765cb8e482d4c5437c" UNIQUE ("post_id"), CONSTRAINT "REL_22504e046765cb8e482d4c5437" UNIQUE ("post_id"), CONSTRAINT "PK_7ede6ee50c70a8f7ced9d64e076" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "system_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying(100) NOT NULL, "value" character varying(500) NOT NULL, "description" character varying(500), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_b1b5bc664526d375c94ce9ad43d" UNIQUE ("key"), CONSTRAINT "PK_82521f08790d248b2a80cc85d40" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "site_id" uuid NOT NULL, "slug" character varying(255) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "sort_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_69d4cd477ab55637aed872c0e3" ON "categories" ("site_id", "slug") `);
        await queryRunner.query(`CREATE TABLE "site_banners" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "site_id" uuid NOT NULL, "post_id" uuid NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "start_at" TIMESTAMP WITH TIME ZONE, "end_at" TIMESTAMP WITH TIME ZONE, "display_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_681a819ed11b0f8953c02e09f88" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "page_views" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "site_id" uuid NOT NULL, "post_id" uuid, "visitor_id" character varying(64) NOT NULL, "viewed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3b1047277a9c2a8cfd618787671" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6b02f0b1a265c0183d06cc7b78" ON "page_views" ("post_id", "viewed_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_eab329ebc3dd0a7a9106e04d65" ON "page_views" ("site_id", "viewed_at") `);
        await queryRunner.query(`CREATE TABLE "cta_clicks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "site_id" uuid NOT NULL, "post_id" uuid, "visitor_id" character varying(64) NOT NULL, "clicked_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_59fc6ba238d0f375e93b41fd06a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b1831e1c73117f73fb0d198f2a" ON "cta_clicks" ("site_id", "clicked_at") `);
        await queryRunner.query(`ALTER TABLE "social_accounts" ADD CONSTRAINT "FK_05a0f282d3bed93ca048a7e54dd" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sites" ADD CONSTRAINT "FK_24c21d04fcce0511d6c52ed9659" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_c4f9a7bd77b489e711277ee5986" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_eb84ec16b52b3ff2ad794b33bc9" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_852f266adc5d67c40405c887b49" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_drafts" ADD CONSTRAINT "FK_22504e046765cb8e482d4c5437c" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_drafts" ADD CONSTRAINT "FK_3e4e6fdeb9e335cad9c8f3b6ec2" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_411cbb14d7ab96d475a721c1cfe" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "site_banners" ADD CONSTRAINT "FK_acafec7d93db0712111d1238ed5" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "site_banners" ADD CONSTRAINT "FK_158eb5b0134858cdcd9af9cd05d" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "page_views" ADD CONSTRAINT "FK_f5237f5fe9ecb1bb0c98d461d03" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cta_clicks" ADD CONSTRAINT "FK_ca0dfe2b0ff281555d3c4d0ed3d" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cta_clicks" DROP CONSTRAINT "FK_ca0dfe2b0ff281555d3c4d0ed3d"`);
        await queryRunner.query(`ALTER TABLE "page_views" DROP CONSTRAINT "FK_f5237f5fe9ecb1bb0c98d461d03"`);
        await queryRunner.query(`ALTER TABLE "site_banners" DROP CONSTRAINT "FK_158eb5b0134858cdcd9af9cd05d"`);
        await queryRunner.query(`ALTER TABLE "site_banners" DROP CONSTRAINT "FK_acafec7d93db0712111d1238ed5"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_411cbb14d7ab96d475a721c1cfe"`);
        await queryRunner.query(`ALTER TABLE "post_drafts" DROP CONSTRAINT "FK_3e4e6fdeb9e335cad9c8f3b6ec2"`);
        await queryRunner.query(`ALTER TABLE "post_drafts" DROP CONSTRAINT "FK_22504e046765cb8e482d4c5437c"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_852f266adc5d67c40405c887b49"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_eb84ec16b52b3ff2ad794b33bc9"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_c4f9a7bd77b489e711277ee5986"`);
        await queryRunner.query(`ALTER TABLE "sites" DROP CONSTRAINT "FK_24c21d04fcce0511d6c52ed9659"`);
        await queryRunner.query(`ALTER TABLE "social_accounts" DROP CONSTRAINT "FK_05a0f282d3bed93ca048a7e54dd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b1831e1c73117f73fb0d198f2a"`);
        await queryRunner.query(`DROP TABLE "cta_clicks"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eab329ebc3dd0a7a9106e04d65"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6b02f0b1a265c0183d06cc7b78"`);
        await queryRunner.query(`DROP TABLE "page_views"`);
        await queryRunner.query(`DROP TABLE "site_banners"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_69d4cd477ab55637aed872c0e3"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "system_settings"`);
        await queryRunner.query(`DROP TABLE "post_drafts"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_efbdb19c538fd8fb5e3752345d"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_26503a75e987672fb5af9258cc"`);
        await queryRunner.query(`DROP TABLE "sites"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4508a993f9340ca4e7547db4ff"`);
        await queryRunner.query(`DROP TABLE "social_accounts"`);
        await queryRunner.query(`DROP TABLE "post_images"`);
        await queryRunner.query(`DROP TABLE "site_storage_usage"`);
    }

}
