import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostComment } from './entities/post-comment.entity';
import { PostLike } from './entities/post-like.entity';
import { PostService } from './service/post.service';
import { PostController } from './controller/post.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostComment, PostLike])],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
