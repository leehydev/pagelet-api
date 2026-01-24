import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Post } from './post.entity';

@Entity('post_drafts')
export class PostDraft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  postId: string;

  @OneToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'varchar', length: 500 })
  subtitle: string;

  @Column({ type: 'jsonb', nullable: true })
  contentJson: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  contentHtml: string | null;

  @Column({ type: 'text', nullable: true })
  contentText: string | null;

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
