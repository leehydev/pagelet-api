import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SuperAdminService } from './superadmin.service';
import { User, AccountStatus } from '../auth/entities/user.entity';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { SystemSettingService } from '../config/system-setting.service';
import { RegistrationMode, SystemSettingKey } from '../config/constants/registration-mode';

describe('SuperAdminService', () => {
  let service: SuperAdminService;
  let userRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let systemSettingService: {
    get: jest.Mock;
    getOrDefault: jest.Mock;
    getOrThrow: jest.Mock;
    set: jest.Mock;
    getSettingEntity: jest.Mock;
  };

  beforeEach(async () => {
    userRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    systemSettingService = {
      get: jest.fn(),
      getOrDefault: jest.fn(),
      getOrThrow: jest.fn(),
      set: jest.fn(),
      getSettingEntity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: SystemSettingService,
          useValue: systemSettingService,
        },
      ],
    }).compile();

    service = module.get<SuperAdminService>(SuperAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWaitlist', () => {
    it('should return list of pending users', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User 1',
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User 2',
          createdAt: new Date('2024-01-02'),
        },
      ];
      userRepository.find.mockResolvedValue(mockUsers);

      const result = await service.getWaitlist();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('user-1');
      expect(result[0].email).toBe('user1@example.com');
      expect(result[1].id).toBe('user-2');
      expect(userRepository.find).toHaveBeenCalledWith({
        where: { accountStatus: AccountStatus.PENDING },
        order: { createdAt: 'ASC' },
        select: ['id', 'email', 'name', 'createdAt'],
      });
    });

    it('should return empty array when no pending users', async () => {
      userRepository.find.mockResolvedValue([]);

      const result = await service.getWaitlist();

      expect(result).toHaveLength(0);
    });
  });

  describe('approveUser', () => {
    it('should approve a pending user', async () => {
      const mockUser = {
        id: 'user-1',
        accountStatus: AccountStatus.PENDING,
      };
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        accountStatus: AccountStatus.ACTIVE,
      });

      await service.approveUser('user-1');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(mockUser.accountStatus).toBe(AccountStatus.ACTIVE);
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.approveUser('non-existent')).rejects.toThrow(BusinessException);

      try {
        await service.approveUser('non-existent');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode.code).toBe(ErrorCode.USER_NOT_FOUND.code);
      }
    });

    it('should throw COMMON_BAD_REQUEST when user is not in pending status', async () => {
      const mockUser = {
        id: 'user-1',
        accountStatus: AccountStatus.ACTIVE,
      };
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.approveUser('user-1')).rejects.toThrow(BusinessException);

      try {
        await service.approveUser('user-1');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode.code).toBe(ErrorCode.COMMON_BAD_REQUEST.code);
      }
    });

    it('should throw COMMON_BAD_REQUEST when user is suspended', async () => {
      const mockUser = {
        id: 'user-1',
        accountStatus: AccountStatus.SUSPENDED,
      };
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.approveUser('user-1')).rejects.toThrow(BusinessException);

      try {
        await service.approveUser('user-1');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode.code).toBe(ErrorCode.COMMON_BAD_REQUEST.code);
      }
    });
  });

  describe('getSetting', () => {
    it('should return setting when it exists', async () => {
      const mockSetting = {
        key: 'registration_mode',
        value: 'PENDING',
        description: '회원가입 모드',
        updatedAt: new Date('2024-01-01'),
      };
      systemSettingService.getSettingEntity.mockResolvedValue(mockSetting);

      const result = await service.getSetting('registration_mode');

      expect(result.key).toBe('registration_mode');
      expect(result.value).toBe('PENDING');
      expect(result.description).toBe('회원가입 모드');
      expect(systemSettingService.getSettingEntity).toHaveBeenCalledWith('registration_mode');
    });

    it('should throw SETTING_NOT_FOUND when setting does not exist', async () => {
      systemSettingService.getSettingEntity.mockResolvedValue(null);

      await expect(service.getSetting('non_existent')).rejects.toThrow(BusinessException);

      try {
        await service.getSetting('non_existent');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode.code).toBe(ErrorCode.SETTING_NOT_FOUND.code);
      }
    });
  });

  describe('updateSetting', () => {
    it('should update registration_mode setting with valid value', async () => {
      const mockSetting = {
        key: SystemSettingKey.REGISTRATION_MODE,
        value: 'PENDING',
        description: '회원가입 모드',
        updatedAt: new Date('2024-01-01'),
      };
      const updatedSetting = {
        ...mockSetting,
        value: RegistrationMode.ACTIVE,
        updatedAt: new Date('2024-01-02'),
      };
      systemSettingService.getSettingEntity
        .mockResolvedValueOnce(mockSetting)
        .mockResolvedValueOnce(updatedSetting);
      systemSettingService.set.mockResolvedValue(undefined);

      const result = await service.updateSetting(
        SystemSettingKey.REGISTRATION_MODE,
        RegistrationMode.ACTIVE,
      );

      expect(result.value).toBe(RegistrationMode.ACTIVE);
      expect(systemSettingService.set).toHaveBeenCalledWith(
        SystemSettingKey.REGISTRATION_MODE,
        RegistrationMode.ACTIVE,
      );
    });

    it('should throw SETTING_NOT_FOUND when setting does not exist', async () => {
      systemSettingService.getSettingEntity.mockResolvedValue(null);

      await expect(
        service.updateSetting(SystemSettingKey.REGISTRATION_MODE, RegistrationMode.ACTIVE),
      ).rejects.toThrow(BusinessException);

      try {
        await service.updateSetting(SystemSettingKey.REGISTRATION_MODE, RegistrationMode.ACTIVE);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode.code).toBe(ErrorCode.SETTING_NOT_FOUND.code);
      }
    });

    it('should throw SETTING_INVALID_VALUE when registration_mode has invalid value', async () => {
      const mockSetting = {
        key: SystemSettingKey.REGISTRATION_MODE,
        value: 'PENDING',
        description: '회원가입 모드',
        updatedAt: new Date('2024-01-01'),
      };
      systemSettingService.getSettingEntity.mockResolvedValue(mockSetting);

      await expect(
        service.updateSetting(SystemSettingKey.REGISTRATION_MODE, 'INVALID_VALUE'),
      ).rejects.toThrow(BusinessException);

      try {
        await service.updateSetting(SystemSettingKey.REGISTRATION_MODE, 'INVALID_VALUE');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode.code).toBe(
          ErrorCode.SETTING_INVALID_VALUE.code,
        );
      }
    });
  });
});
