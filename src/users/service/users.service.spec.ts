import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';

const mockUser: User = {
  role: undefined,
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
};

const mockRepository = {
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('create', () => {
    const dto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('creates user and returns without passwordHash', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);
      mockRepository.create.mockReturnValue({ ...mockUser });
      mockRepository.save.mockResolvedValue({ ...mockUser });

      const result = await service.create(dto);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toMatchObject({ email: 'test@example.com' });
    });

    it('throws ConflictException if email exists', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('hashes password with bcrypt', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      const hashSpy = jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('hashed' as never);
      mockRepository.create.mockReturnValue({ ...mockUser });
      mockRepository.save.mockResolvedValue({ ...mockUser });

      await service.create(dto);

      expect(hashSpy).toHaveBeenCalledWith('password123', 10);
    });
  });

  describe('findAll', () => {
    it('returns array without passwordHash', async () => {
      mockRepository.find.mockResolvedValue([mockUser, mockUser]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      result.forEach((u) => expect(u).not.toHaveProperty('passwordHash'));
    });

    it('returns empty array when no users', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns user without passwordHash', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findOne('uuid-1');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result?.id).toBe('uuid-1');
    });

    it('returns null when not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('updates user and returns without passwordHash', async () => {
      const updated = { ...mockUser, firstName: 'Jane', city: 'Madrid' };
      mockRepository.findOneBy.mockResolvedValueOnce(mockUser);
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.update('uuid-1', {
        firstName: 'Jane',
        city: 'Madrid',
      });

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toMatchObject({ firstName: 'Jane', city: 'Madrid' });
    });

    it('throws NotFoundException when user not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update('nonexistent', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when username already taken', async () => {
      const otherUser = { ...mockUser, id: 'uuid-2', username: 'taken' };
      mockRepository.findOneBy
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(otherUser);

      await expect(
        service.update('uuid-1', { username: 'taken' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByEmailWithPassword', () => {
    it('returns full user including passwordHash', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findByEmailWithPassword('test@example.com');

      expect(result).toHaveProperty('passwordHash');
      expect(result?.email).toBe('test@example.com');
    });

    it('returns null when not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findByEmailWithPassword(
        'notfound@example.com',
      );

      expect(result).toBeNull();
    });
  });
});
