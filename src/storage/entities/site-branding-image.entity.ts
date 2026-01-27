import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Site } from '../../site/entities/site.entity';

export const BrandingImageType = {
  LOGO: 'logo',
  FAVICON: 'favicon',
  OG: 'og',
  CTA: 'cta',
} as const;

export type BrandingImageType = (typeof BrandingImageType)[keyof typeof BrandingImageType];

@Entity('site_branding_images')
@Index(['siteId', 'type'])
export class SiteBrandingImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'site_id' })
  siteId: string;

  @Column({ type: 'varchar', length: 20 })
  type: BrandingImageType;

  @Column({ type: 'varchar', length: 500, name: 's3_key' })
  s3Key: string;

  @Column({ type: 'boolean', name: 'is_active', default: false })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Site, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: Site;
}
