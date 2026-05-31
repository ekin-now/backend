import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../entities/company.entity';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(dto: CreateCompanyDto): Promise<Company> {
    const slug = dto.slug ?? this.generateSlug(dto.name);

    const exists = await this.companyRepository.findOneBy({ slug });
    if (exists) throw new ConflictException('Slug already in use');

    const company = this.companyRepository.create({ ...dto, slug });
    return this.companyRepository.save(company);
  }

  findAll(): Promise<Company[]> {
    return this.companyRepository.findBy({ isActive: true });
  }

  async findOne(id: string): Promise<Company | null> {
    return this.companyRepository.findOneBy({ id });
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.companyRepository.findOneBy({ id });
    if (!company) throw new NotFoundException('Company not found');

    Object.assign(company, dto);
    return this.companyRepository.save(company);
  }

  async remove(id: string): Promise<void> {
    const company = await this.companyRepository.findOneBy({ id });
    if (!company) throw new NotFoundException('Company not found');
    company.isActive = false;
    await this.companyRepository.save(company);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
}
