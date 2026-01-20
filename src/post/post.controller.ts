import { Controller, Post, Body } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserPrincipal } from '../auth/types/jwt-payload.interface';
import { SiteService } from '../site/site.service';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { PostResponseDto } from './dto/post-response.dto';

@Controller('posts')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly siteService: SiteService,
  ) {}

  /**
   * POST /posts
   * 게시글 작성 (온보딩용)
   */
  @Post()
  async createPost(
    @CurrentUser() user: UserPrincipal,
    @Body() dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    // 사용자의 사이트 조회
    const site = await this.siteService.findByUserId(user.userId);
    if (!site) {
      throw BusinessException.fromErrorCode(ErrorCode.SITE_NOT_FOUND);
    }

    const post = await this.postService.createPost(user.userId, site.id, dto);
    
    return new PostResponseDto({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      status: post.status,
      published_at: post.published_at,
      seo_title: post.seo_title,
      seo_description: post.seo_description,
      og_image_url: post.og_image_url,
      created_at: post.created_at,
      updated_at: post.updated_at,
    });
  }
}
