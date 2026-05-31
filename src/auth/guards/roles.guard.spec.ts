import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../decorators/userRole.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

function makeContext(
  role: UserRole | undefined,
  required?: UserRole[],
): ExecutionContext {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(required),
  } as any;
  const request = { user: role !== undefined ? { role } : undefined };
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
    _reflector: reflector,
  } as any;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = makeContext(UserRole.PARTICIPANT);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when user has required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.SUPER_ADMIN]);
    const request = { user: { role: UserRole.SUPER_ADMIN } };
    const ctx = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies access when user does not have required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.SUPER_ADMIN]);
    const request = { user: { role: UserRole.PARTICIPANT } };
    const ctx = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;

    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('allows access when user matches one of multiple required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.SUPER_ADMIN,
      UserRole.COMPANY_ADMIN,
    ]);
    const request = { user: { role: UserRole.COMPANY_ADMIN } };
    const ctx = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('uses ' + ROLES_KEY + ' metadata key', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: UserRole.PARTICIPANT } }),
      }),
    } as any;

    guard.canActivate(ctx);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
  });
});
