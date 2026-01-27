import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('reserved_slugs')
export class ReservedSlug {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string | null;

  @Column({ type: 'boolean', default: false })
  adminOnly: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
