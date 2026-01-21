import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

// TypeScript 타입 (DB enum 사용 안 함)
export const PostImageType = {
  THUMBNAIL: 'THUMBNAIL', // 썸네일
  CONTENT: 'CONTENT', // 본문 이미지
  GALLERY: 'GALLERY', // 갤러리 이미지
} as const;

export type PostImageType = (typeof PostImageType)[keyof typeof PostImageType];

@Entity('post_images')
export class PostImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  siteId: string; // 필수: 어떤 사이트의 이미지인지

  @Column({ type: 'uuid', nullable: true })
  postId: string | null; // 업로드 완료 전에는 null 가능

  @Column({ type: 'varchar', length: 500 })
  s3Key: string;

  @Column({ type: 'bigint' })
  sizeBytes: number;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: PostImageType.THUMBNAIL,
  })
  imageType: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
