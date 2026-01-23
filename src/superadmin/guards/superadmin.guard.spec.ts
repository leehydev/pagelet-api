import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SuperAdminGuard } from './superadmin.guard';
import { BusinessException } from '../../common/exception/business.exception';
import { ErrorCode } from '../../common/exception/error-code';

describe('SuperAdminGuard', () => {
  let guard: SuperAdminGuard;

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

  const createGuard = async (superAdminUserIds: string) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(superAdminUserIds),
          },
        },
      ],
    }).compile();

    return module.get<SuperAdminGuard>(SuperAdminGuard);
  };

  describe('canActivate', () => {
    it('should return true when user is a super admin', async () => {
      guard = await createGuard('admin-1,admin-2');
      const context = mockExecutionContext(mockRequest({ userId: 'admin-1' }));

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true for second super admin in list', async () => {
      guard = await createGuard('admin-1,admin-2');
      const context = mockExecutionContext(mockRequest({ userId: 'admin-2' }));

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw COMMON_FORBIDDEN when user is not a super admin', async () => {
      guard = await createGuard('admin-1,admin-2');
      const context = mockExecutionContext(mockRequest({ userId: 'regular-user' }));

      expect(() => guard.canActivate(context)).toThrow(BusinessException);

      try {
        guard.canActivate(context);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode.code).toBe(ErrorCode.COMMON_FORBIDDEN.code);
      }
    });

    it('should throw COMMON_UNAUTHORIZED when user is not authenticated', async () => {
      guard = await createGuard('admin-1');
      const context = mockExecutionContext(mockRequest(null));

      expect(() => guard.canActivate(context)).toThrow(BusinessException);

      try {
        guard.canActivate(context);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode.code).toBe(
          ErrorCode.COMMON_UNAUTHORIZED.code,
        );
      }
    });

    it('should handle empty SUPERADMIN_USER_IDS', async () => {
      guard = await createGuard('');
      const context = mockExecutionContext(mockRequest({ userId: 'any-user' }));

      expect(() => guard.canActivate(context)).toThrow(BusinessException);

      try {
        guard.canActivate(context);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode.code).toBe(ErrorCode.COMMON_FORBIDDEN.code);
      }
    });

    it('should handle whitespace in SUPERADMIN_USER_IDS', async () => {
      guard = await createGuard(' admin-1 , admin-2 ');
      const context = mockExecutionContext(mockRequest({ userId: 'admin-1' }));

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
