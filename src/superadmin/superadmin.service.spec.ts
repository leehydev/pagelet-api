import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SuperAdminService } from './superadmin.service';
import { User, AccountStatus } from '../auth/entities/user.entity';
import { Site } from '../site/entities/site.entity';
import { Post } from '../post/entities/post.entity';
import { SiteStorageUsage } from '../storage/entities/storage-usage.entity';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { SystemSettingService } from '../config/system-setting.service';
import { RegistrationMode, SystemSettingKey } from '../config/constants/registration-mode';
import { SiteService } from '../site/site.service';

describe('SuperAdminService', () => {
  let service: SuperAdminService;
  let userRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    count: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let siteRepository: {
    find: jest.Mock;
    count: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let postRepository: {
    count: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let storageUsageRepository: {
    createQueryBuilder: jest.Mock;
  };
  let systemSettingService: {
    get: jest.Mock;
    getOrDefault: jest.Mock;
    getOrThrow: jest.Mock;
    set: jest.Mock;
    getSettingEntity: jest.Mock;
  };
  let siteService: {
    getReservedSlugs: jest.Mock;
    isReservedSlugExists: jest.Mock;
    createReservedSlug: jest.Mock;
    findReservedSlugById: jest.Mock;
    deleteReservedSlug: jest.Mock;
  };

  beforeEach(async () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue({ totalUsedBytes: '0', totalMaxBytes: '0' }),
    };

    userRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    siteRepository = {
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    postRepository = {
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    storageUsageRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    systemSettingService = {
      get: jest.fn(),
      getOrDefault: jest.fn(),
      getOrThrow: jest.fn(),
      set: jest.fn(),
      getSettingEntity: jest.fn(),
    };

    siteService = {
      getReservedSlugs: jest.fn(),
      isReservedSlugExists: jest.fn(),
      createReservedSlug: jest.fn(),
      findReservedSlugById: jest.fn(),
      deleteReservedSlug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Site),
          useValue: siteRepository,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: postRepository,
        },
        {
          provide: getRepositoryToken(SiteStorageUsage),
          useValue: storageUsageRepository,
        },
        {
          provide: SystemSettingService,
          useValue: systemSettingService,
        },
        {
          provide: SiteService,
          useValue: siteService,
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
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User 2',
          createdAt: new Date('2024-01-02'),
        },
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User 1',
          createdAt: new Date('2024-01-01'),
        },
      ];
      userRepository.find.mockResolvedValue(mockUsers);

      const result = await service.getWaitlist();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('user-2');
      expect(result[0].email).toBe('user2@example.com');
      expect(result[1].id).toBe('user-1');
      expect(userRepository.find).toHaveBeenCalledWith({
        where: { accountStatus: AccountStatus.PENDING },
        order: { createdAt: 'DESC' },
        select: ['id', 'email', 'name', 'createdAt'],
      });
    });

    it('should return empty array when no pending users', async () => {
      userRepository.find.mockResolvedValue([]);

      const result = await service.getWaitlist();

      expect(result).toHaveLength(0);
    });

    it('should limit results when limit is provided', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User 1',
          createdAt: new Date('2024-01-01'),
        },
      ];
      userRepository.find.mockResolvedValue(mockUsers);

      const result = await service.getWaitlist(5);

      expect(result).toHaveLength(1);
      expect(userRepository.find).toHaveBeenCalledWith({
        where: { accountStatus: AccountStatus.PENDING },
        order: { createdAt: 'DESC' },
        select: ['id', 'email', 'name', 'createdAt'],
        take: 5,
      });
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

  describe('getReservedSlugs', () => {
    it('should return list of reserved slugs', async () => {
      const mockSlugs = [
        { id: 'slug-1', slug: 'admin', reason: '관리자', adminOnly: false, createdAt: new Date() },
        { id: 'slug-2', slug: 'blog', reason: '블로그', adminOnly: true, createdAt: new Date() },
      ];
      siteService.getReservedSlugs.mockResolvedValue(mockSlugs);

      const result = await service.getReservedSlugs();

      expect(result).toHaveLength(2);
      expect(result[0].slug).toBe('admin');
      expect(result[1].adminOnly).toBe(true);
    });
  });

  describe('createReservedSlug', () => {
    it('should create a new reserved slug', async () => {
      const mockSlug = {
        id: 'new-slug-id',
        slug: 'newslug',
        reason: '새 예약어',
        adminOnly: false,
        createdAt: new Date(),
      };
      siteService.isReservedSlugExists.mockResolvedValue(false);
      siteService.createReservedSlug.mockResolvedValue(mockSlug);

      const result = await service.createReservedSlug({
        slug: 'newslug',
        reason: '새 예약어',
        adminOnly: false,
      });

      expect(result.slug).toBe('newslug');
      expect(siteService.createReservedSlug).toHaveBeenCalledWith('newslug', '새 예약어', false);
    });

    it('should throw RESERVED_SLUG_ALREADY_EXISTS when slug exists', async () => {
      siteService.isReservedSlugExists.mockResolvedValue(true);

      await expect(service.createReservedSlug({ slug: 'existing' })).rejects.toThrow(
        BusinessException,
      );

      try {
        await service.createReservedSlug({ slug: 'existing' });
      } catch (error) {
        expect((error as BusinessException).errorCode.code).toBe(
          ErrorCode.RESERVED_SLUG_ALREADY_EXISTS.code,
        );
      }
    });
  });

  describe('deleteReservedSlug', () => {
    it('should delete a reserved slug', async () => {
      siteService.findReservedSlugById.mockResolvedValue({ id: 'slug-id', slug: 'test' });
      siteService.deleteReservedSlug.mockResolvedValue(undefined);

      await service.deleteReservedSlug('slug-id');

      expect(siteService.deleteReservedSlug).toHaveBeenCalledWith('slug-id');
    });

    it('should throw RESERVED_SLUG_NOT_FOUND when slug does not exist', async () => {
      siteService.findReservedSlugById.mockResolvedValue(null);

      await expect(service.deleteReservedSlug('non-existent')).rejects.toThrow(BusinessException);

      try {
        await service.deleteReservedSlug('non-existent');
      } catch (error) {
        expect((error as BusinessException).errorCode.code).toBe(
          ErrorCode.RESERVED_SLUG_NOT_FOUND.code,
        );
      }
    });
  });

  describe('setUserAdmin', () => {
    it('should set user admin status to true', async () => {
      const mockUser = { id: 'user-1', isAdmin: false };
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({ ...mockUser, isAdmin: true });

      await service.setUserAdmin('user-1', true);

      expect(mockUser.isAdmin).toBe(true);
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.setUserAdmin('non-existent', true)).rejects.toThrow(BusinessException);

      try {
        await service.setUserAdmin('non-existent', true);
      } catch (error) {
        expect((error as BusinessException).errorCode.code).toBe(ErrorCode.USER_NOT_FOUND.code);
      }
    });
  });
});
