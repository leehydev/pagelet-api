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
import { Site } from '../../site/entities/site.entity';

// TypeScript 타입 (DB enum 사용 안 함)
export const PostStatus = {
  PRIVATE: 'PRIVATE', // 비공개 (새 글 또는 비공개 전환)
  PUBLISHED: 'PUBLISHED', // 공개
} as const;

export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

@Entity('posts')
@Index(['siteId', 'slug'], { unique: true })
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  siteId: string;

  @ManyToOne(() => Site, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'varchar', length: 500 })
  subtitle: string;

  @Column({ type: 'varchar', length: 255, default: () => 'gen_random_uuid()' })
  slug: string;

  @Column({ type: 'text', nullable: true })
  content: string; // Deprecated: 하위 호환성을 위해 유지

  @Column({ type: 'jsonb', nullable: true })
  contentJson: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  contentHtml: string | null;

  @Column({ type: 'text', nullable: true })
  contentText: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: PostStatus.PRIVATE,
  })
  status: string;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  seoTitle: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  seoDescription: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  ogImageUrl: string | null;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne('Category', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: any;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
