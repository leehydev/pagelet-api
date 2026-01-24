import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('system_settings')
export class SystemSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 500 })
  value: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
