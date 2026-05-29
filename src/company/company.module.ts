import { Module } from '@nestjs/common';
import { CompanyService } from './service/company.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Company } from './entities/company.entity';
import { CompanyController } from './controller/company.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Company, User])],
  providers: [CompanyService],
  controllers: [CompanyController],
  exports: [CompanyService],
})
export class CompanyModule {}
