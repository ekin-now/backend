import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entitu';
import { CreateUserDto } from '../dto/create-user.dto';

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

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }
}
