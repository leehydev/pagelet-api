# [BE] 브랜딩 이미지 삭제 API 구현

## GitHub 이슈
- **이슈 번호**: #63
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/63
- **생성일**: 2026-01-24
- **우선순위**: 중간
- **관련 태스크**: pagelet-app#63 (프론트엔드 삭제 UI)

## 개요

사이트 설정 페이지에서 브랜딩 이미지(로고, 파비콘, OG 이미지, CTA 이미지)를 삭제할 수 있는 API를 구현합니다.

현재 presign/commit API만 존재하며, 업로드된 이미지를 삭제하는 기능이 없습니다.

## 작업 범위

### 포함
- DELETE `/admin/sites/:siteId/assets/branding/:type` API 엔드포인트 추가
- BrandingAssetService에 delete 메서드 구현
- S3에서 브랜딩 파일 삭제
- Site 엔티티의 해당 이미지 URL 필드를 null로 업데이트

### 제외
- 프론트엔드 UI 변경 (별도 이슈)
- 삭제 이력 관리
- 휴지통/복구 기능

## 기술 명세

### 영향받는 파일
- `src/storage/admin-branding-asset.controller.ts` - DELETE 엔드포인트 추가
- `src/storage/branding-asset.service.ts` - delete 메서드 추가
- `src/storage/dto/branding-delete.dto.ts` - (선택) 요청 DTO

### API 명세

```
DELETE /admin/sites/:siteId/assets/branding/:type
```

**Path Parameters:**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| siteId | string (UUID) | 사이트 ID |
| type | BrandingType | 삭제할 브랜딩 타입 (logo, favicon, og, cta) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "type": "logo",
    "updatedAt": "2026-01-24T10:00:00.000Z"
  }
}
```

**Error Cases:**
- 400: 유효하지 않은 type
- 404: 삭제할 이미지가 없음 (해당 필드가 이미 null)

### 구현 로직

```typescript
// branding-asset.service.ts
async delete(siteId: string, type: BrandingType): Promise<BrandingDeleteResponseDto> {
  // 1. Site 조회
  const site = await this.siteService.findById(siteId);

  // 2. 현재 이미지 URL 확인
  const currentUrl = this.getCurrentImageUrl(site, type);
  if (!currentUrl) {
    throw BusinessException.withMessage(
      ErrorCode.RESOURCE_NOT_FOUND,
      '삭제할 이미지가 없습니다'
    );
  }

  // 3. URL에서 S3 Key 추출
  const s3Key = this.extractS3KeyFromUrl(currentUrl);

  // 4. S3에서 파일 삭제
  await this.s3Service.deleteObject(s3Key);

  // 5. Site 엔티티 업데이트 (해당 필드 null로)
  const updateData = this.getNullUpdateData(type);
  const updatedSite = await this.siteService.updateSettings(siteId, updateData);

  return {
    deleted: true,
    type,
    updatedAt: updatedSite.updatedAt.toISOString(),
  };
}

private getCurrentImageUrl(site: Site, type: BrandingType): string | null {
  switch (type) {
    case BrandingType.LOGO: return site.logoImageUrl;
    case BrandingType.FAVICON: return site.faviconUrl;
    case BrandingType.OG: return site.ogImageUrl;
    case BrandingType.CTA: return site.ctaImageUrl;
  }
}

private getNullUpdateData(type: BrandingType) {
  switch (type) {
    case BrandingType.LOGO: return { logoImageUrl: null };
    case BrandingType.FAVICON: return { faviconUrl: null };
    case BrandingType.OG: return { ogImageUrl: null };
    case BrandingType.CTA: return { ctaImageUrl: null };
  }
}

private extractS3KeyFromUrl(url: string): string {
  // CDN URL에서 S3 Key 추출
  // https://assets.pagelet-dev.kr/uploads/sites/{siteId}/branding/logo.png
  // → uploads/sites/{siteId}/branding/logo.png
  const cdnBaseUrl = this.s3Service.getAssetsCdnBaseUrl();
  return url.replace(`${cdnBaseUrl}/`, '');
}
```

### 타입 정의

```typescript
// dto/branding-delete.dto.ts
export class BrandingDeleteResponseDto {
  deleted: boolean;
  type: BrandingType;
  updatedAt: string;
}
```

## 구현 체크리스트
- [ ] BrandingDeleteResponseDto 생성
- [ ] BrandingAssetService.delete() 메서드 구현
- [ ] AdminBrandingAssetController에 DELETE 엔드포인트 추가
- [ ] S3 키 추출 유틸리티 메서드 추가
- [ ] Swagger 문서 추가
- [ ] 에러 처리 (이미지 없음, 권한 없음 등)

## 테스트 계획
- [ ] 정상 삭제 테스트 (각 타입별: logo, favicon, og, cta)
- [ ] 이미지가 없는 경우 404 에러 반환 테스트
- [ ] 다른 사이트 리소스 삭제 시도 시 403 에러 테스트
- [ ] S3 파일 삭제 확인

## 참고 자료
- 기존 commit 로직: `src/storage/branding-asset.service.ts`
- S3 삭제: `src/storage/s3.service.ts` - `deleteObject` 메서드
