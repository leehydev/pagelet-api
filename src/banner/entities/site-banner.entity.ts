import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Site } from '../../site/entities/site.entity';

// Device Type (DB enum 대신 const object 사용)
export const DeviceType = {
  DESKTOP: 'desktop',
  MOBILE: 'mobile',
} as const;
export type DeviceType = (typeof DeviceType)[keyof typeof DeviceType];

@Entity('site_banners')
export class SiteBanner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'site_id' })
  siteId: string;

  @ManyToOne(() => Site, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'varchar', length: 500, name: 'image_url' })
  imageUrl: string;

  @Column({ type: 'varchar', length: 500, name: 'link_url', nullable: true })
  linkUrl: string | null;

  @Column({ type: 'boolean', name: 'open_in_new_tab', default: true })
  openInNewTab: boolean;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', name: 'start_at', nullable: true })
  startAt: Date | null;

  @Column({ type: 'timestamptz', name: 'end_at', nullable: true })
  endAt: Date | null;

  @Column({ type: 'int', name: 'display_order', default: 0 })
  displayOrder: number;

  @Column({ type: 'varchar', length: 255, name: 'alt_text', nullable: true })
  altText: string | null;

  @Column({ type: 'varchar', length: 20, name: 'device_type' })
  deviceType: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
