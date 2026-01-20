import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('site_storage_usage')
export class SiteStorageUsage {
  @PrimaryColumn({ type: 'uuid' })
  site_id: string;

  @Column({ type: 'bigint', default: 0 })
  used_bytes: number;

  @Column({ type: 'bigint', default: 0 })
  reserved_bytes: number;

  @Column({ type: 'bigint', default: 1073741824 }) // 1GB 기본값
  max_bytes: number;
}
