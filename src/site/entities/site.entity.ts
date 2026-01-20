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
  user_id: string;

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
  logo_image_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  favicon_url: string | null;

  // SEO
  @Column({ type: 'varchar', length: 500, nullable: true })
  og_image_url: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  seo_title: string | null;

  @Column({ type: 'text', nullable: true })
  seo_description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  seo_keywords: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  canonical_base_url: string | null;

  @Column({ type: 'boolean', default: false })
  robots_index: boolean;

  // 연락처
  @Column({ type: 'varchar', length: 255, nullable: true })
  contact_email: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contact_phone: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  // 소셜 링크
  @Column({ type: 'varchar', length: 500, nullable: true })
  kakao_channel_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  naver_map_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  instagram_url: string | null;

  // 사업자 정보
  @Column({ type: 'varchar', length: 20, nullable: true })
  business_number: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  business_name: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  representative_name: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
