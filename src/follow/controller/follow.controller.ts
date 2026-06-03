import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FollowService } from '../service/follow.service';
import { FollowResponseDto } from '../dto/follow-response.dto';

@ApiTags('follows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('follows')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @ApiOkResponse({ type: FollowResponseDto, isArray: true })
  @Get('followers')
  getFollowers(@Request() req: { user: { sub: string } }) {
    return this.followService.getFollowers(req.user.sub);
  }

  @ApiOkResponse({ type: FollowResponseDto, isArray: true })
  @Get('following')
  getFollowing(@Request() req: { user: { sub: string } }) {
    return this.followService.getFollowing(req.user.sub);
  }

  @ApiNoContentResponse()
  @HttpCode(204)
  @Post(':userId')
  follow(
    @Request() req: { user: { sub: string } },
    @Param('userId') targetId: string,
  ) {
    return this.followService.follow(req.user.sub, targetId);
  }

  @ApiNoContentResponse()
  @HttpCode(204)
  @Delete(':userId')
  unfollow(
    @Request() req: { user: { sub: string } },
    @Param('userId') targetId: string,
  ) {
    return this.followService.unfollow(req.user.sub, targetId);
  }
}
