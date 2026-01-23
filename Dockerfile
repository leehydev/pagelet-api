# 1단계: 빌드
FROM node:18-alpine AS builder

WORKDIR /app

# package.json 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사
COPY . .

# NestJS 빌드
RUN npm run build

# 2단계: 프로덕션 이미지
FROM node:18-alpine

WORKDIR /app

# 프로덕션 의존성만 설치
COPY package*.json ./
RUN npm ci --only=production

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist

# 포트 노출
EXPOSE 3000

# 🔥 실행 명령어 (여기가 중요!)
CMD ["npm", "run", "start:prod"]
