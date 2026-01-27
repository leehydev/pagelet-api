import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIsAdminAndReservedSlugs1769516924894 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. User 테이블에 is_admin 컬럼 추가
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "is_admin" boolean NOT NULL DEFAULT false
    `);

    // 2. reserved_slugs 테이블 생성
    await queryRunner.query(`
      CREATE TABLE "reserved_slugs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" varchar(100) NOT NULL,
        "reason" varchar(255),
        "admin_only" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reserved_slugs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_reserved_slugs_slug" UNIQUE ("slug")
      )
    `);

    // 3. slug 컬럼에 인덱스 생성
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_reserved_slugs_slug" ON "reserved_slugs" ("slug")
    `);

    // 4. 기본 예약어 삽입
    const reservedSlugs = [
      // 시스템/인프라 관련
      { slug: 'www', reason: '기본 서브도메인', adminOnly: false },
      { slug: 'admin', reason: '관리자 페이지', adminOnly: false },
      { slug: 'api', reason: 'API 서버', adminOnly: false },
      { slug: 'app', reason: '앱 서브도메인', adminOnly: false },
      { slug: 'mail', reason: '메일 서버', adminOnly: false },
      { slug: 'ftp', reason: 'FTP 서버', adminOnly: false },
      { slug: 'cdn', reason: 'CDN 서버', adminOnly: false },
      { slug: 'static', reason: '정적 파일 서버', adminOnly: false },
      { slug: 'assets', reason: '에셋 서버', adminOnly: false },
      { slug: 'img', reason: '이미지 서버', adminOnly: false },
      { slug: 'images', reason: '이미지 서버', adminOnly: false },
      { slug: 'files', reason: '파일 서버', adminOnly: false },
      { slug: 'uploads', reason: '업로드 서버', adminOnly: false },
      { slug: 'media', reason: '미디어 서버', adminOnly: false },
      { slug: 'download', reason: '다운로드 서버', adminOnly: false },

      // 서비스 관련
      { slug: 'blog', reason: '블로그 서브도메인', adminOnly: true },
      { slug: 'shop', reason: '쇼핑몰 서브도메인', adminOnly: true },
      { slug: 'store', reason: '스토어 서브도메인', adminOnly: true },
      { slug: 'help', reason: '도움말 페이지', adminOnly: false },
      { slug: 'support', reason: '고객지원', adminOnly: false },
      { slug: 'status', reason: '상태 페이지', adminOnly: false },
      { slug: 'docs', reason: '문서 페이지', adminOnly: false },
      { slug: 'portal', reason: '포털 페이지', adminOnly: false },
      { slug: 'dashboard', reason: '대시보드', adminOnly: false },
      { slug: 'console', reason: '콘솔', adminOnly: false },

      // 인증/보안 관련
      { slug: 'auth', reason: '인증 서비스', adminOnly: false },
      { slug: 'login', reason: '로그인 페이지', adminOnly: false },
      { slug: 'logout', reason: '로그아웃', adminOnly: false },
      { slug: 'signup', reason: '회원가입', adminOnly: false },
      { slug: 'signin', reason: '로그인', adminOnly: false },
      { slug: 'register', reason: '회원가입', adminOnly: false },
      { slug: 'account', reason: '계정 관리', adminOnly: false },
      { slug: 'profile', reason: '프로필', adminOnly: false },
      { slug: 'settings', reason: '설정', adminOnly: false },
      { slug: 'oauth', reason: 'OAuth 서비스', adminOnly: false },
      { slug: 'sso', reason: 'SSO 서비스', adminOnly: false },

      // 비즈니스/마케팅 관련
      { slug: 'about', reason: '회사 소개', adminOnly: false },
      { slug: 'contact', reason: '문의', adminOnly: false },
      { slug: 'pricing', reason: '요금제', adminOnly: false },
      { slug: 'plans', reason: '플랜', adminOnly: false },
      { slug: 'billing', reason: '결제', adminOnly: false },
      { slug: 'payment', reason: '결제', adminOnly: false },
      { slug: 'enterprise', reason: '엔터프라이즈', adminOnly: true },
      { slug: 'business', reason: '비즈니스', adminOnly: true },
      { slug: 'team', reason: '팀', adminOnly: true },
      { slug: 'teams', reason: '팀', adminOnly: true },

      // 법적/정책 관련
      { slug: 'terms', reason: '이용약관', adminOnly: false },
      { slug: 'privacy', reason: '개인정보처리방침', adminOnly: false },
      { slug: 'policy', reason: '정책', adminOnly: false },
      { slug: 'legal', reason: '법적 고지', adminOnly: false },
      { slug: 'tos', reason: '서비스 약관', adminOnly: false },
      { slug: 'gdpr', reason: 'GDPR', adminOnly: false },
      { slug: 'cookies', reason: '쿠키 정책', adminOnly: false },

      // 개발자/테크 관련
      { slug: 'dev', reason: '개발 환경', adminOnly: false },
      { slug: 'developer', reason: '개발자', adminOnly: false },
      { slug: 'developers', reason: '개발자', adminOnly: false },
      { slug: 'git', reason: 'Git 서비스', adminOnly: false },
      { slug: 'github', reason: 'GitHub 예약어', adminOnly: false },
      { slug: 'gitlab', reason: 'GitLab 예약어', adminOnly: false },
      { slug: 'code', reason: '코드', adminOnly: true },
      { slug: 'demo', reason: '데모', adminOnly: true },
      { slug: 'test', reason: '테스트', adminOnly: false },
      { slug: 'staging', reason: '스테이징', adminOnly: false },
      { slug: 'sandbox', reason: '샌드박스', adminOnly: false },
      { slug: 'beta', reason: '베타', adminOnly: false },

      // 커뮤니티 관련
      { slug: 'forum', reason: '포럼', adminOnly: true },
      { slug: 'community', reason: '커뮤니티', adminOnly: true },
      { slug: 'feedback', reason: '피드백', adminOnly: false },
      { slug: 'news', reason: '뉴스', adminOnly: true },
      { slug: 'announcements', reason: '공지사항', adminOnly: false },
      { slug: 'events', reason: '이벤트', adminOnly: true },
      { slug: 'calendar', reason: '캘린더', adminOnly: true },

      // 시스템 예약어
      { slug: 'home', reason: '홈', adminOnly: false },
      { slug: 'index', reason: '인덱스', adminOnly: false },
      { slug: 'root', reason: '루트', adminOnly: false },
      { slug: 'null', reason: '시스템 예약어', adminOnly: false },
      { slug: 'undefined', reason: '시스템 예약어', adminOnly: false },
      { slug: 'default', reason: '시스템 예약어', adminOnly: false },
      { slug: 'public', reason: '공개', adminOnly: false },
      { slug: 'private', reason: '비공개', adminOnly: false },
      { slug: 'internal', reason: '내부용', adminOnly: false },
      { slug: 'external', reason: '외부용', adminOnly: false },

      // 기타 서비스
      { slug: 'search', reason: '검색', adminOnly: false },
      { slug: 'explore', reason: '탐색', adminOnly: true },
      { slug: 'discover', reason: '발견', adminOnly: true },
      { slug: 'trending', reason: '트렌딩', adminOnly: true },
      { slug: 'popular', reason: '인기', adminOnly: true },
      { slug: 'new', reason: '새로운', adminOnly: false },
      { slug: 'latest', reason: '최신', adminOnly: false },
      { slug: 'featured', reason: '추천', adminOnly: true },
      { slug: 'official', reason: '공식', adminOnly: false },
      { slug: 'pagelet', reason: '서비스명', adminOnly: false },
    ];

    for (const item of reservedSlugs) {
      await queryRunner.query(
        `INSERT INTO "reserved_slugs" ("slug", "reason", "admin_only") VALUES ($1, $2, $3)`,
        [item.slug, item.reason, item.adminOnly],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. reserved_slugs 테이블 삭제
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reserved_slugs_slug"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reserved_slugs"`);

    // 2. User 테이블에서 is_admin 컬럼 삭제
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_admin"`);
  }
}
