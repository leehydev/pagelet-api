import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { Draft } from './entities/draft.entity';
import { DraftImageService } from './draft-image.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';
import { Post, PostStatus } from '../post/entities/post.entity';
import { PostService } from '../post/post.service';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';

// Draft 보관 기간 (일)
const DRAFT_RETENTION_DAYS = 14;

@Injectable()
export class DraftService {
  private readonly logger = new Logger(DraftService.name);

  constructor(
    @InjectRepository(Draft)
    private readonly draftRepository: Repository<Draft>,
    @Inject(forwardRef(() => PostService))
    private readonly postService: PostService,
    @Inject(forwardRef(() => DraftImageService))
    private readonly draftImageService: DraftImageService,
  ) {}

  /**
   * Draft 목록 조회 (사이트별)
   */
  async findBySiteId(siteId: string, userId: string): Promise<Draft[]> {
    return this.draftRepository.find({
      where: { siteId, userId },
      relations: ['category'],
      order: { updatedAt: 'DESC' },
    });
  }

  /**
   * Draft 단건 조회
   */
  async findById(id: string): Promise<Draft | null> {
    return this.draftRepository.findOne({
      where: { id },
      relations: ['category'],
    });
  }

  /**
   * Draft 생성
   */
  async createDraft(siteId: string, userId: string, dto: CreateDraftDto): Promise<Draft> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + DRAFT_RETENTION_DAYS);

    const draft = this.draftRepository.create({
      siteId,
      userId,
      title: dto.title ?? '',
      subtitle: dto.subtitle ?? '',
      slug: dto.slug ?? null,
      contentJson: dto.contentJson ?? null,
      contentHtml: dto.contentHtml ?? null,
      contentText: dto.contentText ?? null,
      seoTitle: dto.seoTitle ?? null,
      seoDescription: dto.seoDescription ?? null,
      ogImageUrl: dto.ogImageUrl ?? null,
      categoryId: dto.categoryId ?? null,
      expiresAt,
    });

    const saved = await this.draftRepository.save(draft);
    this.logger.log(`Created draft: ${saved.id} for site: ${siteId}`);

    // 이미지 동기화
    await this.draftImageService.syncImages(saved.id, siteId, saved.contentHtml, saved.ogImageUrl);

    return saved;
  }

  /**
   * Draft 수정
   */
  async updateDraft(
    id: string,
    siteId: string,
    userId: string,
    dto: UpdateDraftDto,
  ): Promise<Draft> {
    const draft = await this.draftRepository.findOne({
      where: { id, siteId, userId },
    });

    if (!draft) {
      throw BusinessException.fromErrorCode(ErrorCode.DRAFT_NOT_FOUND);
    }

    // 만료 시간 갱신
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + DRAFT_RETENTION_DAYS);
    draft.expiresAt = expiresAt;

    // 제공된 필드만 업데이트
    if (dto.title !== undefined) draft.title = dto.title;
    if (dto.subtitle !== undefined) draft.subtitle = dto.subtitle;
    if (dto.slug !== undefined) draft.slug = dto.slug;
    if (dto.contentJson !== undefined) draft.contentJson = dto.contentJson;
    if (dto.contentHtml !== undefined) draft.contentHtml = dto.contentHtml;
    if (dto.contentText !== undefined) draft.contentText = dto.contentText;
    if (dto.seoTitle !== undefined) draft.seoTitle = dto.seoTitle;
    if (dto.seoDescription !== undefined) draft.seoDescription = dto.seoDescription;
    if (dto.ogImageUrl !== undefined) draft.ogImageUrl = dto.ogImageUrl;
    if (dto.categoryId !== undefined) draft.categoryId = dto.categoryId;

    const saved = await this.draftRepository.save(draft);
    this.logger.log(`Updated draft: ${id}`);

    // 이미지 동기화
    await this.draftImageService.syncImages(saved.id, siteId, saved.contentHtml, saved.ogImageUrl);

    return saved;
  }

  /**
   * Draft 삭제
   */
  async deleteDraft(id: string, siteId: string, userId: string): Promise<void> {
    const draft = await this.draftRepository.findOne({
      where: { id, siteId, userId },
    });

    if (!draft) {
      throw BusinessException.fromErrorCode(ErrorCode.DRAFT_NOT_FOUND);
    }

    await this.draftRepository.remove(draft);
    this.logger.log(`Deleted draft: ${id}`);
  }

  /**
   * Draft를 Post로 발행
   */
  @Transactional()
  async publishDraft(id: string, siteId: string, userId: string): Promise<Post> {
    const draft = await this.draftRepository.findOne({
      where: { id, siteId, userId },
    });

    if (!draft) {
      throw BusinessException.fromErrorCode(ErrorCode.DRAFT_NOT_FOUND);
    }

    // slug 중복 검사
    if (draft.slug) {
      const isAvailable = await this.postService.isSlugAvailable(siteId, draft.slug);
      if (!isAvailable) {
        throw BusinessException.fromErrorCode(ErrorCode.DRAFT_SLUG_ALREADY_EXISTS);
      }
    }

    // Post 생성
    const post = await this.postService.createPost(userId, siteId, {
      title: draft.title,
      subtitle: draft.subtitle,
      slug: draft.slug ?? undefined,
      contentJson: draft.contentJson ?? {},
      contentHtml: draft.contentHtml ?? undefined,
      contentText: draft.contentText ?? undefined,
      seoTitle: draft.seoTitle ?? undefined,
      seoDescription: draft.seoDescription ?? undefined,
      ogImageUrl: draft.ogImageUrl ?? undefined,
      categoryId: draft.categoryId ?? undefined,
      status: PostStatus.PUBLISHED,
    });

    // Draft 이미지를 Post 이미지로 이전
    await this.draftImageService.transferToPost(draft.id, post.id, siteId);

    // Draft 삭제
    await this.draftRepository.remove(draft);
    this.logger.log(`Published draft ${id} to post ${post.id}`);

    return post;
  }

  /**
   * 만료된 Draft 정리 (스케줄러용)
   */
  async cleanupExpiredDrafts(): Promise<number> {
    const expiredDrafts = await this.draftRepository.find({
      where: {
        expiresAt: LessThan(new Date()),
      },
    });

    if (expiredDrafts.length === 0) {
      return 0;
    }

    for (const draft of expiredDrafts) {
      try {
        // 연결된 이미지 정리는 CASCADE로 처리됨
        await this.draftRepository.remove(draft);
        this.logger.log(`Cleaned up expired draft: ${draft.id}`);
      } catch (error) {
        this.logger.error(`Failed to cleanup draft ${draft.id}: ${error.message}`);
      }
    }

    return expiredDrafts.length;
  }
}
