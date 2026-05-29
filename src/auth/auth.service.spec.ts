import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/service/users.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/userRole.enum';

const mockUser: User = {
  id: 'uuid-1',
  email: 'test@example.com',
  passwordHash: 'hashed',
  firstName: 'John',
  lastName: 'Doe',
  username: undefined,
  phone: undefined,
  avatarUrl: undefined,
  birthDate: undefined,
  isActive: true,
  isVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  role: UserRole.PARTICIPANT,
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { findByEmailWithPassword: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('validateUser', () => {
    it('returns user without passwordHash on valid credentials', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toMatchObject({ id: 'uuid-1', email: 'test@example.com' });
    });

    it('returns null when email not found', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      const result = await service.validateUser('notfound@example.com', 'pass');

      expect(result).toBeNull();
    });

    it('returns null when password is wrong', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await service.validateUser('test@example.com', 'wrong');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('returns access_token', () => {
      jwtService.sign.mockReturnValue('signed-token');

      const result = service.login({
        id: 'uuid-1',
        email: 'test@example.com',
        role: 'PARTICIPANT',
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'uuid-1',
        email: 'test@example.com',
        role: 'PARTICIPANT',
      });
      expect(result).toEqual({ access_token: 'signed-token' });
    });
  });
});
