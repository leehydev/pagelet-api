import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PostService } from './post.service';
import { PostDraftService } from './post-draft.service';
import { Post, PostStatus } from './entities/post.entity';
import { PostImageService } from '../storage/post-image.service';
import { S3Service } from '../storage/s3.service';
import { CategoryService } from '../category/category.service';

describe('PostService', () => {
  let service: PostService;
  let postRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    createQueryBuilder: jest.Mock;
    remove: jest.Mock;
    findAndCount: jest.Mock;
  };

  const mockPostImageService = {
    findByPostId: jest.fn(),
    linkToPost: jest.fn(),
    unlinkFromPost: jest.fn(),
  };

  const mockS3Service = {
    getAssetsCdnBaseUrl: jest.fn().mockReturnValue('https://assets.example.com'),
  };

  const mockCategoryService = {
    findById: jest.fn(),
    findBySlug: jest.fn(),
    ensureDefaultCategory: jest.fn(),
  };

  const mockPostDraftService = {
    findByPostId: jest.fn(),
    hasDraft: jest.fn(),
    saveDraft: jest.fn(),
    deleteDraft: jest.fn(),
    createDraftFromPost: jest.fn(),
    applyDraftToPost: jest.fn(),
  };

  beforeEach(async () => {
    postRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn(),
      remove: jest.fn(),
      findAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: getRepositoryToken(Post),
          useValue: postRepository,
        },
        {
          provide: PostImageService,
          useValue: mockPostImageService,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: CategoryService,
          useValue: mockCategoryService,
        },
        {
          provide: PostDraftService,
          useValue: mockPostDraftService,
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAdjacentPosts', () => {
    const siteId = 'site-1';

    const createMockPost = (id: string, index: number): Partial<Post> => ({
      id,
      title: `Post ${index}`,
      slug: `post-${index}`,
      ogImageUrl: null,
      publishedAt: new Date(`2024-01-${String(10 - index).padStart(2, '0')}`), // DESC order
      status: PostStatus.PUBLISHED,
    });

    it('should return 5 adjacent posts with current post in the middle', async () => {
      // 10개 게시글 중 중간(5번째, index 4) 게시글 조회
      const mockPosts = Array.from({ length: 10 }, (_, i) => createMockPost(`post-${i}`, i));
      postRepository.find.mockResolvedValue(mockPosts);

      const result = await service.findAdjacentPosts(siteId, 'post-4');

      expect(result.posts).toHaveLength(5);
      expect(result.currentIndex).toBe(2); // 5개 중 중간 (index 2)
      expect(result.posts[0].id).toBe('post-2');
      expect(result.posts[1].id).toBe('post-3');
      expect(result.posts[2].id).toBe('post-4'); // current
      expect(result.posts[3].id).toBe('post-5');
      expect(result.posts[4].id).toBe('post-6');
    });

    it('should handle first post (not enough previous posts)', async () => {
      // 10개 게시글 중 첫 번째(index 0) 게시글 조회
      const mockPosts = Array.from({ length: 10 }, (_, i) => createMockPost(`post-${i}`, i));
      postRepository.find.mockResolvedValue(mockPosts);

      const result = await service.findAdjacentPosts(siteId, 'post-0');

      expect(result.posts).toHaveLength(5);
      expect(result.currentIndex).toBe(0);
      expect(result.posts[0].id).toBe('post-0'); // current (first)
      expect(result.posts[1].id).toBe('post-1');
      expect(result.posts[2].id).toBe('post-2');
      expect(result.posts[3].id).toBe('post-3');
      expect(result.posts[4].id).toBe('post-4');
    });

    it('should handle last post (not enough next posts)', async () => {
      // 10개 게시글 중 마지막(index 9) 게시글 조회
      const mockPosts = Array.from({ length: 10 }, (_, i) => createMockPost(`post-${i}`, i));
      postRepository.find.mockResolvedValue(mockPosts);

      const result = await service.findAdjacentPosts(siteId, 'post-9');

      expect(result.posts).toHaveLength(5);
      expect(result.currentIndex).toBe(4); // 마지막 위치
      expect(result.posts[0].id).toBe('post-5');
      expect(result.posts[1].id).toBe('post-6');
      expect(result.posts[2].id).toBe('post-7');
      expect(result.posts[3].id).toBe('post-8');
      expect(result.posts[4].id).toBe('post-9'); // current (last)
    });

    it('should handle second post (one previous post)', async () => {
      // 10개 게시글 중 두 번째(index 1) 게시글 조회
      const mockPosts = Array.from({ length: 10 }, (_, i) => createMockPost(`post-${i}`, i));
      postRepository.find.mockResolvedValue(mockPosts);

      const result = await service.findAdjacentPosts(siteId, 'post-1');

      expect(result.posts).toHaveLength(5);
      expect(result.currentIndex).toBe(1);
      expect(result.posts[0].id).toBe('post-0');
      expect(result.posts[1].id).toBe('post-1'); // current
      expect(result.posts[2].id).toBe('post-2');
      expect(result.posts[3].id).toBe('post-3');
      expect(result.posts[4].id).toBe('post-4');
    });

    it('should return all posts when less than 5 posts exist', async () => {
      // 3개 게시글만 존재
      const mockPosts = Array.from({ length: 3 }, (_, i) => createMockPost(`post-${i}`, i));
      postRepository.find.mockResolvedValue(mockPosts);

      const result = await service.findAdjacentPosts(siteId, 'post-1');

      expect(result.posts).toHaveLength(3);
      expect(result.currentIndex).toBe(1);
      expect(result.posts[0].id).toBe('post-0');
      expect(result.posts[1].id).toBe('post-1'); // current
      expect(result.posts[2].id).toBe('post-2');
    });

    it('should handle single post', async () => {
      // 게시글 1개만 존재
      const mockPosts = [createMockPost('post-0', 0)];
      postRepository.find.mockResolvedValue(mockPosts);

      const result = await service.findAdjacentPosts(siteId, 'post-0');

      expect(result.posts).toHaveLength(1);
      expect(result.currentIndex).toBe(0);
      expect(result.posts[0].id).toBe('post-0');
    });

    it('should return empty when current post not found', async () => {
      // 현재 게시글이 목록에 없는 경우
      const mockPosts = Array.from({ length: 3 }, (_, i) => createMockPost(`post-${i}`, i));
      postRepository.find.mockResolvedValue(mockPosts);

      const result = await service.findAdjacentPosts(siteId, 'non-existent');

      expect(result.posts).toHaveLength(0);
      expect(result.currentIndex).toBe(-1);
    });

    it('should return empty when no posts exist', async () => {
      // 게시글이 없는 경우
      postRepository.find.mockResolvedValue([]);

      const result = await service.findAdjacentPosts(siteId, 'post-0');

      expect(result.posts).toHaveLength(0);
      expect(result.currentIndex).toBe(-1);
    });

    it('should call repository with correct parameters', async () => {
      const mockPosts = [createMockPost('post-0', 0)];
      postRepository.find.mockResolvedValue(mockPosts);

      await service.findAdjacentPosts(siteId, 'post-0');

      expect(postRepository.find).toHaveBeenCalledWith({
        where: {
          siteId: siteId,
          status: PostStatus.PUBLISHED,
        },
        order: { publishedAt: 'DESC' },
        select: ['id', 'title', 'slug', 'ogImageUrl', 'publishedAt'],
      });
    });

    it('should handle custom count parameter', async () => {
      // count = 3 으로 호출 시 앞뒤 1개씩
      const mockPosts = Array.from({ length: 10 }, (_, i) => createMockPost(`post-${i}`, i));
      postRepository.find.mockResolvedValue(mockPosts);

      const result = await service.findAdjacentPosts(siteId, 'post-5', { count: 3 });

      expect(result.posts).toHaveLength(3);
      expect(result.currentIndex).toBe(1);
      expect(result.posts[0].id).toBe('post-4');
      expect(result.posts[1].id).toBe('post-5'); // current
      expect(result.posts[2].id).toBe('post-6');
    });

    it('should filter by categoryId when provided', async () => {
      const categoryId = 'category-1';
      const mockPosts = Array.from({ length: 5 }, (_, i) => createMockPost(`post-${i}`, i));
      postRepository.find.mockResolvedValue(mockPosts);

      await service.findAdjacentPosts(siteId, 'post-2', { categoryId });

      expect(postRepository.find).toHaveBeenCalledWith({
        where: {
          siteId: siteId,
          status: PostStatus.PUBLISHED,
          categoryId: categoryId,
        },
        order: { publishedAt: 'DESC' },
        select: ['id', 'title', 'slug', 'ogImageUrl', 'publishedAt'],
      });
    });
  });
});
