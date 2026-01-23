import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SuperAdminService } from './superadmin.service';
import { User, AccountStatus } from '../auth/entities/user.entity';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';

describe('SuperAdminService', () => {
  let service: SuperAdminService;
  let userRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    userRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
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
});
