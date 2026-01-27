import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

// PostImageType과 동일한 타입 사용
export const DraftImageType = {
  THUMBNAIL: 'THUMBNAIL',
  CONTENT: 'CONTENT',
  GALLERY: 'GALLERY',
} as const;

export type DraftImageType = (typeof DraftImageType)[keyof typeof DraftImageType];

@Entity('draft_images')
@Index('IX_draft_images_draft_id', ['draftId'])
@Index('IX_draft_images_pending_delete', ['pendingDelete'], { where: '"pending_delete" = true' })
export class DraftImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  draftId: string;

  @Column({ type: 'uuid' })
  siteId: string;

  @Column({ type: 'varchar', length: 500 })
  s3Key: string;

  @Column({ type: 'bigint', default: 0 })
  sizeBytes: number;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: DraftImageType.CONTENT,
  })
  imageType: string;

  @Column({ type: 'boolean', default: false })
  pendingDelete: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
