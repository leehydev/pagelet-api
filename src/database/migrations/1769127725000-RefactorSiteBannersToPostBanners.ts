import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorSiteBannersToPostBanners1769127725000 implements MigrationInterface {
  name = 'RefactorSiteBannersToPostBanners1769127725000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 기존 테이블 삭제 (데이터가 없으므로 안전하게 삭제)
    await queryRunner.query(`DROP TABLE IF EXISTS site_banners`);

    // 새 테이블 생성 (게시글 기반 배너)
    await queryRunner.query(`
      CREATE TABLE site_banners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        start_at TIMESTAMPTZ,
        end_at TIMESTAMPTZ,
        display_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // 인덱스 생성
    await queryRunner.query(`CREATE INDEX idx_site_banners_site_id ON site_banners(site_id)`);
    await queryRunner.query(`CREATE INDEX idx_site_banners_post_id ON site_banners(post_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 인덱스 삭제
    await queryRunner.query(`DROP INDEX IF EXISTS idx_site_banners_post_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_site_banners_site_id`);

    // 새 테이블 삭제
    await queryRunner.query(`DROP TABLE IF EXISTS site_banners`);

    // 기존 테이블 복원 (이미지 기반 배너)
    await queryRunner.query(`
      CREATE TABLE site_banners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
        image_url VARCHAR(500) NOT NULL,
        link_url VARCHAR(500),
        open_in_new_tab BOOLEAN NOT NULL DEFAULT true,
        is_active BOOLEAN NOT NULL DEFAULT true,
        start_at TIMESTAMPTZ,
        end_at TIMESTAMPTZ,
        display_order INT NOT NULL DEFAULT 0,
        alt_text VARCHAR(255),
        device_type VARCHAR(20) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_site_banners_site_id ON site_banners(site_id)`);
  }
}
