import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { SportEventModule } from './sport-event/sport-event.module';
import { SportSubEventModule } from './sport-sub-event/sport-sub-event.module';
import { StorageModule } from './storage/storage.module';
import { FollowModule } from './follow/follow.module';
import { PostModule } from './post/post.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        ssl: false,
      }),
    }),
    UsersModule,
    AuthModule,
    CompanyModule,
    SportEventModule,
    SportSubEventModule,
    StorageModule,
    FollowModule,
    PostModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
