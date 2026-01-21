import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

// TypeScript 타입 (DB enum 사용 안 함)
export const OAuthProvider = {
  KAKAO: 'KAKAO',
} as const;

export type OAuthProvider = (typeof OAuthProvider)[keyof typeof OAuthProvider];

@Entity('social_accounts')
@Index(['provider', 'providerUserId'], { unique: true })
export class SocialAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.socialAccounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'varchar',
    length: 50,
  })
  provider: string;

  @Column({ type: 'varchar', length: 255 })
  providerUserId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  connectedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
