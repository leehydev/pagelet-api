import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SocialAccount } from './social-account.entity';

export const AccountStatus = {
  ONBOARDING: 'ONBOARDING',
  ACTIVE: 'ACTIVE',
} as const;

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export const OnboardingStep = {
  PROFILE: 1,
  SITE: 2,
  FIRST_POST: 3,
} as const;

export type OnboardingStep = (typeof OnboardingStep)[keyof typeof OnboardingStep];

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 20, default: AccountStatus.ONBOARDING })
  accountStatus: AccountStatus;

  @Column({ type: 'integer', nullable: true })
  onboardingStep: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => SocialAccount, (socialAccount) => socialAccount.user)
  socialAccounts: SocialAccount[];
}
