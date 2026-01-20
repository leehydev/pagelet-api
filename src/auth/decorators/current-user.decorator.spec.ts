import { ExecutionContext } from '@nestjs/common';
import { currentUserFactory } from './current-user.decorator';
import { UserPrincipal } from '../types/jwt-payload.interface';

describe('CurrentUser Decorator', () => {
  const mockUserPrincipal: UserPrincipal = {
    userId: 'user-123',
    roles: ['admin', 'user'],
  };

  const mockExecutionContext = (user?: UserPrincipal | null): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: user === null ? undefined : user ?? mockUserPrincipal,
        }),
        getResponse: () => ({}),
        getNext: () => jest.fn(),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getType: jest.fn(),
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as ExecutionContext;
  };

  it('should extract user from request', () => {
    const context = mockExecutionContext();
    const result = currentUserFactory(undefined, context);

    expect(result).toEqual(mockUserPrincipal);
    expect(result.userId).toBe('user-123');
    expect(result.roles).toEqual(['admin', 'user']);
  });

  it('should return user with empty roles when roles are not provided', () => {
    const userWithoutRoles: UserPrincipal = {
      userId: 'user-456',
    };
    const context = mockExecutionContext(userWithoutRoles);
    const result = currentUserFactory(undefined, context);

    expect(result).toEqual(userWithoutRoles);
    expect(result.userId).toBe('user-456');
    expect(result.roles).toBeUndefined();
  });

  it('should return user with empty roles array', () => {
    const userWithEmptyRoles: UserPrincipal = {
      userId: 'user-789',
      roles: [],
    };
    const context = mockExecutionContext(userWithEmptyRoles);
    const result = currentUserFactory(undefined, context);

    expect(result).toEqual(userWithEmptyRoles);
    expect(result.roles).toEqual([]);
  });

  it('should handle undefined user (should not happen in practice but test for safety)', () => {
    const context = mockExecutionContext(null);
    const result = currentUserFactory(undefined, context);

    expect(result).toBeUndefined();
  });
});
