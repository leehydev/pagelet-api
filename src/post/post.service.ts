import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  /**
   * 게시글 생성
   */
  async createPost(userId: string, siteId: string, dto: CreatePostDto): Promise<Post> {
    const post = this.postRepository.create({
      user_id: userId,
      site_id: siteId,
      title: dto.title,
      content: dto.content,
    });

    const saved = await this.postRepository.save(post);
    this.logger.log(`Created post: ${saved.id} for user: ${userId}`);
    return saved;
  }

  /**
   * 사이트의 게시글 목록 조회
   */
  async findBySiteId(siteId: string): Promise<Post[]> {
    return this.postRepository.find({
      where: { site_id: siteId },
      order: { created_at: 'DESC' },
    });
  }
}
