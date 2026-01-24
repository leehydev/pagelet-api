import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostDraft } from './entities/post-draft.entity';
import { Post, PostStatus } from './entities/post.entity';
import { SaveDraftDto } from './dto/save-draft.dto';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';

@Injectable()
export class PostDraftService {
  private readonly logger = new Logger(PostDraftService.name);

  constructor(
    @InjectRepository(PostDraft)
    private readonly postDraftRepository: Repository<PostDraft>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  /**
   * 드래프트 조회 by postId
   */
  async findByPostId(postId: string): Promise<PostDraft | null> {
    return this.postDraftRepository.findOne({ where: { postId } });
  }

  /**
   * 드래프트 존재 여부 확인
   */
  async hasDraft(postId: string): Promise<boolean> {
    const count = await this.postDraftRepository.count({ where: { postId } });
    return count > 0;
  }

  /**
   * 드래프트 저장 (upsert)
   * - 드래프트가 없으면 게시글 내용을 기반으로 새로 생성
   * - 드래프트가 있으면 제공된 필드만 업데이트
   */
  async saveDraft(postId: string, siteId: string, dto: SaveDraftDto): Promise<PostDraft> {
    // 게시글 조회
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post || post.siteId !== siteId) {
      throw BusinessException.fromErrorCode(ErrorCode.POST_NOT_FOUND);
    }

    // 기존 드래프트 조회
    let draft = await this.postDraftRepository.findOne({ where: { postId } });

    if (!draft) {
      // 드래프트가 없으면 게시글 내용을 기반으로 생성
      draft = this.postDraftRepository.create({
        postId,
        title: dto.title ?? post.title,
        subtitle: dto.subtitle ?? post.subtitle,
        contentJson: dto.contentJson ?? post.contentJson,
        contentHtml: dto.contentHtml ?? post.contentHtml,
        contentText: dto.contentText ?? post.contentText,
        seoTitle: dto.seoTitle ?? post.seoTitle,
        seoDescription: dto.seoDescription ?? post.seoDescription,
        ogImageUrl: dto.ogImageUrl ?? post.ogImageUrl,
        categoryId: dto.categoryId ?? post.categoryId,
      });
    } else {
      // 드래프트가 있으면 제공된 필드만 업데이트
      if (dto.title !== undefined) draft.title = dto.title;
      if (dto.subtitle !== undefined) draft.subtitle = dto.subtitle;
      if (dto.contentJson !== undefined) draft.contentJson = dto.contentJson;
      if (dto.contentHtml !== undefined) draft.contentHtml = dto.contentHtml;
      if (dto.contentText !== undefined) draft.contentText = dto.contentText;
      if (dto.seoTitle !== undefined) draft.seoTitle = dto.seoTitle;
      if (dto.seoDescription !== undefined) draft.seoDescription = dto.seoDescription;
      if (dto.ogImageUrl !== undefined) draft.ogImageUrl = dto.ogImageUrl;
      if (dto.categoryId !== undefined) draft.categoryId = dto.categoryId;
    }

    const saved = await this.postDraftRepository.save(draft);
    this.logger.log(`Saved draft for post: ${postId}`);

    return saved;
  }

  /**
   * 드래프트 삭제
   */
  async deleteDraft(postId: string, siteId: string): Promise<void> {
    // 게시글 조회 (권한 확인)
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post || post.siteId !== siteId) {
      throw BusinessException.fromErrorCode(ErrorCode.POST_NOT_FOUND);
    }

    const draft = await this.postDraftRepository.findOne({ where: { postId } });
    if (draft) {
      await this.postDraftRepository.remove(draft);
      this.logger.log(`Deleted draft for post: ${postId}`);
    }
  }

  /**
   * 게시글 -> 드래프트 복사 (편집 시작 시)
   */
  async createDraftFromPost(post: Post): Promise<PostDraft> {
    // 기존 드래프트가 있으면 반환
    const existingDraft = await this.postDraftRepository.findOne({
      where: { postId: post.id },
    });
    if (existingDraft) {
      return existingDraft;
    }

    // 새 드래프트 생성
    const draft = this.postDraftRepository.create({
      postId: post.id,
      title: post.title,
      subtitle: post.subtitle,
      contentJson: post.contentJson,
      contentHtml: post.contentHtml,
      contentText: post.contentText,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      ogImageUrl: post.ogImageUrl,
      categoryId: post.categoryId,
    });

    const saved = await this.postDraftRepository.save(draft);
    this.logger.log(`Created draft from post: ${post.id}`);

    return saved;
  }

  /**
   * 드래프트 -> 게시글 적용 (발행/재발행 시)
   * - 드래프트 내용을 게시글에 복사
   * - 드래프트 삭제
   * - status를 PUBLISHED로 변경
   */
  async applyDraftToPost(postId: string, siteId: string): Promise<Post> {
    // 게시글 조회
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post || post.siteId !== siteId) {
      throw BusinessException.fromErrorCode(ErrorCode.POST_NOT_FOUND);
    }

    // 드래프트 조회
    const draft = await this.postDraftRepository.findOne({ where: { postId } });

    if (draft) {
      // 드래프트 내용을 게시글에 복사
      post.title = draft.title;
      post.subtitle = draft.subtitle;
      post.contentJson = draft.contentJson;
      post.contentHtml = draft.contentHtml;
      post.contentText = draft.contentText;
      post.seoTitle = draft.seoTitle;
      post.seoDescription = draft.seoDescription;
      post.ogImageUrl = draft.ogImageUrl;
      post.categoryId = draft.categoryId;

      // 드래프트 삭제
      await this.postDraftRepository.remove(draft);
      this.logger.log(`Applied draft to post: ${postId}`);
    }

    // status를 PUBLISHED로 변경
    const wasNotPublished = post.status !== PostStatus.PUBLISHED;
    post.status = PostStatus.PUBLISHED;

    // 최초 발행 시 publishedAt 설정
    if (wasNotPublished || !post.publishedAt) {
      post.publishedAt = new Date();
    }

    const saved = await this.postRepository.save(post);
    this.logger.log(`Published post: ${postId}`);

    return saved;
  }
}
