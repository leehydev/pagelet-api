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

@Entity('cta_clicks')
@Index(['siteId', 'clickedAt'])
export class CtaClick {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  siteId: string;

  @ManyToOne(() => Site, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'uuid', nullable: true })
  postId: string | null; // 클릭 발생 페이지

  @Column({ type: 'varchar', length: 64 })
  visitorId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  clickedAt: Date;
}
