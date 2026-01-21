import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('site_storage_usage')
export class SiteStorageUsage {
  @PrimaryColumn({ type: 'uuid' })
  siteId: string;

  @Column({ type: 'bigint', default: 0 })
  usedBytes: number;

  @Column({ type: 'bigint', default: 0 })
  reservedBytes: number;

  @Column({ type: 'bigint', default: 1073741824 }) // 1GB 기본값
  maxBytes: number;
}
