import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from '../service/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserRole } from '../entities/userRole.enum';

const mockUserResult = {
  id: 'uuid-1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  isActive: true,
  isVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  role: UserRole.PARTICIPANT,
};

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(UsersController);
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('delegates to usersService.create and returns result', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };
      usersService.create.mockResolvedValue(mockUserResult);

      const result = await controller.create(dto);

      expect(usersService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUserResult);
    });
  });

  describe('findAll', () => {
    it('returns array from usersService.findAll', async () => {
      usersService.findAll.mockResolvedValue([mockUserResult]);

      const result = await controller.findAll();

      expect(result).toEqual([mockUserResult]);
    });
  });

  describe('findOne', () => {
    it('returns user when found', async () => {
      usersService.findOne.mockResolvedValue(mockUserResult);

      const result = await controller.findOne('uuid-1');

      expect(usersService.findOne).toHaveBeenCalledWith('uuid-1');
      expect(result).toEqual(mockUserResult);
    });

    it('throws NotFoundException when user not found', async () => {
      usersService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('delegates to usersService.update and returns result', async () => {
      const dto: UpdateUserDto = { firstName: 'Jane', city: 'Madrid' };
      const updated = { ...mockUserResult, firstName: 'Jane' };
      usersService.update.mockResolvedValue(updated);

      const req = { user: { id: 'uuid-1', role: UserRole.PARTICIPANT } };
      const result = await controller.update('uuid-1', dto, req as any);

      expect(usersService.update).toHaveBeenCalledWith('uuid-1', dto);
      expect(result).toEqual(updated);
    });
  });
});
