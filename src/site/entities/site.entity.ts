import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('sites')
export class Site {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  slug: string;

  // ===== Site Settings =====

  // 브랜딩
  @Column({ type: 'varchar', length: 500, nullable: true })
  logoImageUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  faviconUrl: string | null;

  // SEO
  @Column({ type: 'varchar', length: 500, nullable: true })
  ogImageUrl: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  seoTitle: string | null;

  @Column({ type: 'text', nullable: true })
  seoDescription: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  seoKeywords: string | null;

  @Column({ type: 'boolean', default: false })
  robotsIndex: boolean;

  // 연락처
  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contactPhone: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  // 소셜 링크
  @Column({ type: 'varchar', length: 500, nullable: true })
  kakaoChannelUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  naverMapUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  instagramUrl: string | null;

  // 사업자 정보
  @Column({ type: 'varchar', length: 20, nullable: true })
  businessNumber: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  businessName: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  representativeName: string | null;

  // 폰트 설정
  @Column({ type: 'varchar', length: 20, nullable: true, default: null })
  fontKey: string | null; // 'noto_sans' | 'noto_serif'

  // CTA 설정
  @Column({ type: 'boolean', default: false })
  ctaEnabled: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ctaType: string | null; // 'text' | 'image'

  @Column({ type: 'varchar', length: 100, nullable: true })
  ctaText: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  ctaImageUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  ctaLink: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
