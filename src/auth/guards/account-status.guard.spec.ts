import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountStatusGuard } from './account-status.guard';
import { User, AccountStatus } from '../entities/user.entity';
import { BusinessException } from '../../common/exception/business.exception';
import { ErrorCode } from '../../common/exception/error-code';

describe('AccountStatusGuard', () => {
  let guard: AccountStatusGuard;
  let reflector: Reflector;
  let userRepository: { findOne: jest.Mock };

  const mockRequest = (user: { userId: string } | null = null) => ({
    user,
  });

  const mockExecutionContext = (request: ReturnType<typeof mockRequest>): ExecutionContext => {
    const handler = jest.fn();
    const controller = jest.fn();

    return {
      getHandler: () => handler,
      getClass: () => controller,
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
        getNext: () => jest.fn(),
      }),
      getType: () => 'http',
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountStatusGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    guard = module.get<AccountStatusGuard>(AccountStatusGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when @Public() decorator is present', async () => {
      const context = mockExecutionContext(mockRequest());
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return true when user is not authenticated', async () => {
      const context = mockExecutionContext(mockRequest(null));
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return true for ACTIVE user', async () => {
      const context = mockExecutionContext(mockRequest({ userId: 'user-1' }));
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      userRepository.findOne.mockResolvedValue({
        id: 'user-1',
        accountStatus: AccountStatus.ACTIVE,
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true for ONBOARDING user', async () => {
      const context = mockExecutionContext(mockRequest({ userId: 'user-1' }));
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      userRepository.findOne.mockResolvedValue({
        id: 'user-1',
        accountStatus: AccountStatus.ONBOARDING,
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ACCOUNT_PENDING for PENDING user', async () => {
      const context = mockExecutionContext(mockRequest({ userId: 'user-1' }));
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      userRepository.findOne.mockResolvedValue({
        id: 'user-1',
        accountStatus: AccountStatus.PENDING,
      });

      await expect(guard.canActivate(context)).rejects.toThrow(BusinessException);

      try {
        await guard.canActivate(context);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode.code).toBe(ErrorCode.ACCOUNT_PENDING.code);
      }
    });

    it('should throw ACCOUNT_SUSPENDED for SUSPENDED user', async () => {
      const context = mockExecutionContext(mockRequest({ userId: 'user-1' }));
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      userRepository.findOne.mockResolvedValue({
        id: 'user-1',
        accountStatus: AccountStatus.SUSPENDED,
      });

      await expect(guard.canActivate(context)).rejects.toThrow(BusinessException);

      try {
        await guard.canActivate(context);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode.code).toBe(ErrorCode.ACCOUNT_SUSPENDED.code);
      }
    });

    it('should throw ACCOUNT_WITHDRAWN for WITHDRAWN user', async () => {
      const context = mockExecutionContext(mockRequest({ userId: 'user-1' }));
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      userRepository.findOne.mockResolvedValue({
        id: 'user-1',
        accountStatus: AccountStatus.WITHDRAWN,
      });

      await expect(guard.canActivate(context)).rejects.toThrow(BusinessException);

      try {
        await guard.canActivate(context);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode.code).toBe(ErrorCode.ACCOUNT_WITHDRAWN.code);
      }
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      const context = mockExecutionContext(mockRequest({ userId: 'user-1' }));
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      userRepository.findOne.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(BusinessException);

      try {
        await guard.canActivate(context);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode.code).toBe(ErrorCode.USER_NOT_FOUND.code);
      }
    });
  });
});
