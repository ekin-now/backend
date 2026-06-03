import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserRole } from '../../auth/decorators/userRole.enum';
import { PostService } from '../service/post.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { PostFeedQueryDto } from '../dto/post-feed-query.dto';
import { PostResponseDto, CommentResponseDto } from '../dto/post-response.dto';

type AuthReq = { user: { id: string; role: UserRole } };

@ApiTags('posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @ApiOkResponse({ type: PostResponseDto, isArray: true })
  @Get('feed')
  getFeed(@Request() req: AuthReq, @Query() query: PostFeedQueryDto) {
    return this.postService.getFeed(req.user.id, query);
  }

  @ApiCreatedResponse({ type: PostResponseDto })
  @Post()
  create(@Request() req: AuthReq, @Body() dto: CreatePostDto) {
    return this.postService.create(dto, req.user.id);
  }

  @ApiOkResponse({ type: PostResponseDto })
  @Get(':id')
  findOne(@Request() req: AuthReq, @Param('id') id: string) {
    return this.postService.findOne(id, req.user.id);
  }

  @ApiNoContentResponse()
  @HttpCode(204)
  @Delete(':id')
  remove(@Request() req: AuthReq, @Param('id') id: string) {
    return this.postService.remove(id, req.user.id, req.user.role);
  }

  @ApiNoContentResponse()
  @HttpCode(204)
  @Post(':id/likes')
  like(@Request() req: AuthReq, @Param('id') id: string) {
    return this.postService.like(id, req.user.id);
  }

  @ApiNoContentResponse()
  @HttpCode(204)
  @Delete(':id/likes')
  unlike(@Request() req: AuthReq, @Param('id') id: string) {
    return this.postService.unlike(id, req.user.id);
  }

  @ApiOkResponse({ type: CommentResponseDto, isArray: true })
  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.postService.getComments(id);
  }

  @ApiCreatedResponse({ type: CommentResponseDto })
  @Post(':id/comments')
  addComment(
    @Request() req: AuthReq,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postService.addComment(id, req.user.id, dto);
  }

  @ApiNoContentResponse()
  @HttpCode(204)
  @Delete(':id/comments/:commentId')
  removeComment(
    @Request() req: AuthReq,
    @Param('commentId') commentId: string,
  ) {
    return this.postService.removeComment(
      commentId,
      req.user.id,
      req.user.role,
    );
  }
}
