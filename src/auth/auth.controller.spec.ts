import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: { login: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('calls authService.login with req.user and returns token', () => {
      const user = { id: 'uuid-1', email: 'test@example.com' };
      authService.login.mockReturnValue({ access_token: 'token-abc' });

      const result = controller.login({ user }, {} as any);

      expect(authService.login).toHaveBeenCalledWith(user);
      expect(result).toEqual({ access_token: 'token-abc' });
    });
  });
});
