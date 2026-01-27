import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly assetsCdnUrl: string;

  constructor(private readonly configService: ConfigService) {
    const s3Config = this.configService.get('s3');

    this.s3Client = new S3Client({
      region: s3Config.region,
    });

    this.bucket = s3Config.bucket;
    this.assetsCdnUrl = s3Config.assetsCdnUrl;
  }

  /**
   * Presigned URL 생성 (PUT 요청용)
   * @param s3Key S3 오브젝트 키
   * @param contentType 파일 MIME 타입
   * @param expiresIn 만료 시간 (초), 기본 5분
   * @returns Presigned URL
   */
  async generatePresignedUrl(
    s3Key: string,
    contentType: string,
    expiresIn: number = 300,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });
    this.logger.log(`Generated presigned URL for ${s3Key}, expires in ${expiresIn}s`);
    return url;
  }

  /**
   * S3 오브젝트 메타데이터 조회 (HEAD Object)
   * @param s3Key S3 오브젝트 키
   * @returns 오브젝트 메타데이터
   */
  async headObject(s3Key: string): Promise<{ ContentLength: number; ContentType: string }> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
    });

    const response = await this.s3Client.send(command);
    return {
      ContentLength: response.ContentLength || 0,
      ContentType: response.ContentType || 'application/octet-stream',
    };
  }

  /**
   * S3 오브젝트 삭제
   * @param s3Key S3 오브젝트 키
   */
  async deleteObject(s3Key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
    });

    await this.s3Client.send(command);
    this.logger.log(`Deleted S3 object: ${s3Key}`);
  }

  /**
   * Public URL 생성
   * @param s3Key S3 오브젝트 키
   * @returns Public URL
   */
  getPublicUrl(s3Key: string): string {
    return `${this.assetsCdnUrl}/${s3Key}`;
  }

  /**
   * Assets CDN Base URL 반환
   * @returns Base URL (예: https://assets.pagelet-dev.kr)
   */
  getAssetsCdnBaseUrl(): string {
    return this.assetsCdnUrl;
  }

  /**
   * S3 Key 생성 (레거시 - 하위 호환성)
   * @deprecated Use generatePostImageKey instead
   * @param siteId 사이트 ID
   * @param filename 원본 파일명
   * @returns S3 Key
   */
  generateS3Key(siteId: string, filename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const ext = filename.split('.').pop()?.toLowerCase() || 'bin';
    return `uploads/${siteId}/${timestamp}-${random}.${ext}`;
  }

  /**
   * 게시글 이미지 S3 Key 생성
   * 경로: uploads/sites/{siteId}/posts/{postId}/images/{imageId}.{ext}
   * @param siteId 사이트 ID
   * @param postId 게시글 ID (없으면 'unassigned')
   * @param imageId 이미지 ID
   * @param ext 파일 확장자
   * @returns S3 Key
   */
  generatePostImageKey(
    siteId: string,
    postId: string | null,
    imageId: string,
    ext: string,
  ): string {
    const folder = postId || 'unassigned';
    return `uploads/sites/${siteId}/posts/${folder}/images/${imageId}.${ext}`;
  }

  /**
   * 브랜딩 임시 S3 Key 생성
   * 경로: uploads/sites/{siteId}/branding/tmp/{type}_{timestamp}.{ext}
   * @param siteId 사이트 ID
   * @param type 브랜딩 타입 (logo, favicon, og)
   * @param ext 파일 확장자
   * @returns S3 Key
   */
  generateBrandingTmpKey(siteId: string, type: string, ext: string): string {
    const timestamp = Date.now();
    return `uploads/sites/${siteId}/branding/tmp/${type}_${timestamp}.${ext}`;
  }

  /**
   * 브랜딩 최종 S3 Key 생성
   * 경로: uploads/sites/{siteId}/branding/{type}_{timestamp}.{ext}
   * @param siteId 사이트 ID
   * @param type 브랜딩 타입 (logo, favicon, og)
   * @param ext 파일 확장자
   * @returns S3 Key
   */
  generateBrandingFinalKey(siteId: string, type: string, ext: string): string {
    const timestamp = Date.now();
    return `uploads/sites/${siteId}/branding/${type}_${timestamp}.${ext}`;
  }

  /**
   * S3 오브젝트 복사
   * @param sourceKey 원본 S3 Key
   * @param destKey 대상 S3 Key
   */
  async copyObject(sourceKey: string, destKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${sourceKey}`,
      Key: destKey,
    });

    await this.s3Client.send(command);
    this.logger.log(`Copied S3 object: ${sourceKey} -> ${destKey}`);
  }

  /**
   * 파일명에서 확장자 추출
   * @param filename 파일명
   * @returns 확장자 (소문자)
   */
  extractExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'bin';
  }
}
