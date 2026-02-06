import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { google, indexing_v3 } from 'googleapis';

import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { Post, PostStatus } from '../post/entities/post.entity';
import { IndexingResponseDto } from './dto/indexing-response.dto';

const INDEXING_BATCH_LIMIT = 200;

@Injectable()
export class IndexingService implements OnModuleInit {
  private readonly logger = new Logger(IndexingService.name);
  private indexingClient: indexing_v3.Indexing;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  onModuleInit() {
    const credentialsJson = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS');

    if (!credentialsJson) {
      this.logger.warn(
        'GOOGLE_SERVICE_ACCOUNT_CREDENTIALS is not set. Indexing API will be unavailable.',
      );
      return;
    }

    const credentials = JSON.parse(credentialsJson);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    this.indexingClient = google.indexing({
      version: 'v3',
      auth,
    });

    this.logger.log('Google Indexing API client initialized');
  }

  async requestIndexing(url: string): Promise<IndexingResponseDto> {
    if (!this.indexingClient) {
      throw BusinessException.fromErrorCode(ErrorCode.INDEXING_NOT_CONFIGURED);
    }

    try {
      const response = await this.indexingClient.urlNotifications.publish({
        requestBody: {
          url,
          type: 'URL_UPDATED',
        },
      });

      this.logger.log(`Indexing requested for URL: ${url}`);

      const metadata = response.data.urlNotificationMetadata;

      return new IndexingResponseDto({
        url: metadata?.url ?? url,
        type: 'URL_UPDATED',
        notifyTime: metadata?.latestUpdate?.notifyTime ?? new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Failed to request indexing for URL: ${url}`, error?.stack || error);

      if (error?.response?.status === 429) {
        throw BusinessException.fromErrorCode(ErrorCode.INDEXING_QUOTA_EXCEEDED);
      }

      throw BusinessException.fromErrorCode(
        ErrorCode.INDEXING_REQUEST_FAILED,
        `Google Indexing API 요청에 실패했습니다: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  @Cron('0 3 * * *', { timeZone: 'Asia/Seoul' })
  async indexPublishedPosts(): Promise<void> {
    this.logger.log('[인덱싱] 발행된 포스트 색인 시작...');

    if (!this.indexingClient) {
      this.logger.log(
        'Skipping scheduled indexing: GOOGLE_SERVICE_ACCOUNT_CREDENTIALS not configured',
      );
      return;
    }

    const tenantDomain = this.configService.get<string>('TENANT_DOMAIN');

    const posts = await this.postRepository
      .createQueryBuilder('post')
      .innerJoinAndSelect('post.site', 'site')
      .where('post.status = :status', { status: PostStatus.PUBLISHED })
      .andWhere('(post.indexedAt IS NULL OR post.updatedAt > post.indexedAt)')
      .orderBy('post.publishedAt', 'ASC')
      .take(INDEXING_BATCH_LIMIT)
      .getMany();

    if (posts.length === 0) {
      this.logger.log('No posts to index');
      return;
    }

    this.logger.log(`Indexing ${posts.length} posts`);

    let successCount = 0;

    for (const post of posts) {
      const url = `https://${post.site.slug}.${tenantDomain}/${post.slug}`;

      try {
        await this.indexingClient.urlNotifications.publish({
          requestBody: { url, type: 'URL_UPDATED' },
        });

        await this.postRepository.update(post.id, { indexedAt: new Date() });
        successCount++;
      } catch (error) {
        this.logger.error(`Failed to index post ${post.id} (${url}): ${error?.message}`);

        if (error?.response?.status === 429) {
          this.logger.warn('Quota exceeded, stopping batch');
          break;
        }
      }
    }

    this.logger.log(`Indexing complete: ${successCount}/${posts.length} succeeded`);
  }
}
