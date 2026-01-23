import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Site } from '../../site/entities/site.entity';

@Entity('page_views')
@Index(['siteId', 'viewedAt'])
@Index(['postId', 'viewedAt'])
export class PageView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  siteId: string;

  @ManyToOne(() => Site, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'uuid', nullable: true })
  postId: string | null; // null이면 메인페이지

  @Column({ type: 'varchar', length: 64 })
  visitorId: string; // 익명 방문자 식별자

  @CreateDateColumn({ type: 'timestamptz' })
  viewedAt: Date;
}
