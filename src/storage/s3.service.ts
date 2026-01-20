import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
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
   * S3 Key 생성
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
}
