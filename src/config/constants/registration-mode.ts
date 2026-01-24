/**
 * 회원가입 승인 모드
 * - PENDING: 관리자 승인 필요 (베타/제한 운영 시)
 * - ACTIVE: 즉시 활성화 (일반 운영 시)
 */
export const RegistrationMode = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
} as const;

export type RegistrationMode = (typeof RegistrationMode)[keyof typeof RegistrationMode];

/**
 * 시스템 설정 키 상수
 */
export const SystemSettingKey = {
  REGISTRATION_MODE: 'registration_mode',
} as const;

export type SystemSettingKey = (typeof SystemSettingKey)[keyof typeof SystemSettingKey];
