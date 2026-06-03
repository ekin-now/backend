import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CompanyService } from './company.service';
import { Company } from '../entities/company.entity';
import { CreateCompanyDto } from '../dto/create-company.dto';

const mockCompany: Company = {
  id: 'uuid-1',
  name: 'Ekinnow Sports',
  slug: 'ekinnow-sports',
  description: 'Sports company',
  website: undefined,
  email: undefined,
  phone: undefined,
  logoUrl: undefined,
  bannerUrl: undefined,
  country: undefined,
  city: undefined,
  address: undefined,
  sportType: undefined,
  companyType: undefined,
  isActive: true,
  users: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  findOneBy: jest.fn(),
  findBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

describe('CompanyService', () => {
  let service: CompanyService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        { provide: getRepositoryToken(Company), useValue: mockRepository },
      ],
    }).compile();

    service = module.get(CompanyService);
  });

  describe('create', () => {
    const dto: CreateCompanyDto = { name: 'Ekinnow Sports' };

    it('creates company with auto-generated slug', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockCompany);
      mockRepository.save.mockResolvedValue(mockCompany);

      const result = await service.create(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'ekinnow-sports' }),
      );
      expect(result).toEqual(mockCompany);
    });

    it('uses provided slug over auto-generated', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockCompany);
      mockRepository.save.mockResolvedValue(mockCompany);

      await service.create({ ...dto, slug: 'custom-slug' });

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'custom-slug' }),
      );
    });

    it('throws ConflictException if slug exists', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockCompany);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns only active companies', async () => {
      mockRepository.findBy.mockResolvedValue([mockCompany]);

      const result = await service.findAll();

      expect(mockRepository.findBy).toHaveBeenCalledWith({ isActive: true });
      expect(result).toEqual([mockCompany]);
    });
  });

  describe('findOne', () => {
    it('returns company by id', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockCompany);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(mockCompany);
    });

    it('returns null when not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('updates and returns company', async () => {
      const updated = { ...mockCompany, city: 'Madrid' };
      mockRepository.findOneBy.mockResolvedValue(mockCompany);
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.update('uuid-1', { city: 'Madrid' });

      expect(result).toMatchObject({ city: 'Madrid' });
    });

    it('throws NotFoundException when not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update('nonexistent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('sets isActive to false', async () => {
      mockRepository.findOneBy.mockResolvedValue({ ...mockCompany });
      mockRepository.save.mockResolvedValue({
        ...mockCompany,
        isActive: false,
      });

      await service.remove('uuid-1');

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('throws NotFoundException when not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
