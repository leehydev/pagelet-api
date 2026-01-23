# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM node:18-alpine AS deps

WORKDIR /app

# package.json과 lock 파일만 먼저 복사 (캐싱 최적화)
COPY package.json package-lock.json* ./

# 의존성 설치 (수정됨!)
RUN npm ci --omit=dev && \
    npm cache clean --force

# ==========================================
# Stage 2: Build
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /app

# 빌드용 의존성 설치
COPY package.json package-lock.json* ./
RUN npm ci

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

# ==========================================
# Stage 3: Production
# ==========================================
FROM node:18-alpine AS production

WORKDIR /app

# 보안을 위한 non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# 프로덕션 의존성만 복사
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# 빌드된 파일 복사
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

# 환경변수 기본값 설정
ENV NODE_ENV=production \
    PORT=3000

# 사용자 전환
USER nestjs

# 포트 노출
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# NestJS 실행
CMD ["node", "dist/main.js"]
