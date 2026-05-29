import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const exists = await this.usersRepository.findOneBy({ email: dto.email });
    if (exists) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.create({
      ...dto,
      passwordHash,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
    });

    const saved = await this.usersRepository.save(user);
    const { passwordHash: _hash, ...result } = saved;
    return result;
  }

  async findAll(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.usersRepository.find();
    return users.map(({ passwordHash: _hash, ...u }) => u);
  }

  async findOne(id: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) return null;
    const { passwordHash: _hash, ...result } = user;
    return result;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');

    if (dto.username && dto.username !== user.username) {
      const taken = await this.usersRepository.findOneBy({
        username: dto.username,
      });
      if (taken) throw new ConflictException('Username already in use');
    }

    Object.assign(user, {
      ...dto,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : user.birthDate,
    });

    const saved = await this.usersRepository.save(user);
    const { passwordHash: _hash, ...result } = saved;
    return result;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }
}
