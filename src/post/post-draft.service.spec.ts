import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PostDraftService } from './post-draft.service';
import { PostService } from './post.service';
import { PostDraft } from './entities/post-draft.entity';
import { Post, PostStatus } from './entities/post.entity';
import { SaveDraftDto } from './dto/save-draft.dto';
import { BusinessException } from '../common/exception/business.exception';

describe('PostDraftService', () => {
  let service: PostDraftService;
  let postDraftRepository: {
    findOne: jest.Mock;
    count: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    remove: jest.Mock;
  };
  let postRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let postService: {
    syncImagesForPostAndDraft: jest.Mock;
  };

  const mockSiteId = 'site-123';
  const mockPostId = 'post-123';
  const mockUserId = 'user-123';

  const mockPost: Partial<Post> = {
    id: mockPostId,
    siteId: mockSiteId,
    userId: mockUserId,
    title: 'Original Title',
    subtitle: 'Original Subtitle',
    contentJson: { type: 'doc', content: [] },
    contentHtml: '<p>Original content</p>',
    contentText: 'Original content',
    seoTitle: 'Original SEO Title',
    seoDescription: 'Original SEO Description',
    ogImageUrl: 'https://example.com/image.jpg',
    categoryId: 'category-123',
    status: PostStatus.PUBLISHED,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDraft: Partial<PostDraft> = {
    id: 'draft-123',
    postId: mockPostId,
    title: 'Draft Title',
    subtitle: 'Draft Subtitle',
    contentJson: { type: 'doc', content: [{ type: 'paragraph' }] },
    contentHtml: '<p>Draft content</p>',
    contentText: 'Draft content',
    seoTitle: 'Draft SEO Title',
    seoDescription: 'Draft SEO Description',
    ogImageUrl: 'https://example.com/draft-image.jpg',
    categoryId: 'category-456',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    postDraftRepository = {
      findOne: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };

    postRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    postService = {
      syncImagesForPostAndDraft: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostDraftService,
        {
          provide: getRepositoryToken(PostDraft),
          useValue: postDraftRepository,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: postRepository,
        },
        {
          provide: PostService,
          useValue: postService,
        },
      ],
    }).compile();

    service = module.get<PostDraftService>(PostDraftService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByPostId', () => {
    it('should return draft when it exists', async () => {
      postDraftRepository.findOne.mockResolvedValue(mockDraft);

      const result = await service.findByPostId(mockPostId);

      expect(result).toEqual(mockDraft);
      expect(postDraftRepository.findOne).toHaveBeenCalledWith({
        where: { postId: mockPostId },
      });
    });

    it('should return null when draft does not exist', async () => {
      postDraftRepository.findOne.mockResolvedValue(null);

      const result = await service.findByPostId(mockPostId);

      expect(result).toBeNull();
    });
  });

  describe('hasDraft', () => {
    it('should return true when draft exists', async () => {
      postDraftRepository.count.mockResolvedValue(1);

      const result = await service.hasDraft(mockPostId);

      expect(result).toBe(true);
      expect(postDraftRepository.count).toHaveBeenCalledWith({
        where: { postId: mockPostId },
      });
    });

    it('should return false when draft does not exist', async () => {
      postDraftRepository.count.mockResolvedValue(0);

      const result = await service.hasDraft(mockPostId);

      expect(result).toBe(false);
    });
  });

  describe('saveDraft', () => {
    const saveDraftDto: SaveDraftDto = {
      title: 'Updated Title',
      contentHtml: '<p>Updated content</p>',
    };

    it('should create new draft when draft does not exist', async () => {
      postRepository.findOne.mockResolvedValue(mockPost);
      postDraftRepository.findOne.mockResolvedValue(null);
      const createdDraft = { ...mockPost, ...saveDraftDto, id: 'new-draft-123' };
      postDraftRepository.create.mockReturnValue(createdDraft);
      postDraftRepository.save.mockResolvedValue(createdDraft);

      const result = await service.saveDraft(mockPostId, mockSiteId, saveDraftDto);

      expect(postDraftRepository.create).toHaveBeenCalled();
      expect(postDraftRepository.save).toHaveBeenCalled();
      expect(result.title).toBe('Updated Title');
    });

    it('should update existing draft when draft exists', async () => {
      postRepository.findOne.mockResolvedValue(mockPost);
      postDraftRepository.findOne.mockResolvedValue({ ...mockDraft });
      const updatedDraft = { ...mockDraft, ...saveDraftDto };
      postDraftRepository.save.mockResolvedValue(updatedDraft);

      const result = await service.saveDraft(mockPostId, mockSiteId, saveDraftDto);

      expect(postDraftRepository.save).toHaveBeenCalled();
      expect(result.title).toBe('Updated Title');
      expect(result.contentHtml).toBe('<p>Updated content</p>');
    });

    it('should throw exception when post not found', async () => {
      postRepository.findOne.mockResolvedValue(null);

      await expect(service.saveDraft(mockPostId, mockSiteId, saveDraftDto)).rejects.toThrow(
        BusinessException,
      );
    });

    it('should throw exception when post belongs to different site', async () => {
      postRepository.findOne.mockResolvedValue({ ...mockPost, siteId: 'other-site' });

      await expect(service.saveDraft(mockPostId, mockSiteId, saveDraftDto)).rejects.toThrow(
        BusinessException,
      );
    });
  });

  describe('deleteDraft', () => {
    it('should delete draft when it exists', async () => {
      postRepository.findOne.mockResolvedValue(mockPost);
      postDraftRepository.findOne.mockResolvedValue(mockDraft);

      await service.deleteDraft(mockPostId, mockSiteId);

      expect(postDraftRepository.remove).toHaveBeenCalledWith(mockDraft);
    });

    it('should do nothing when draft does not exist', async () => {
      postRepository.findOne.mockResolvedValue(mockPost);
      postDraftRepository.findOne.mockResolvedValue(null);

      await service.deleteDraft(mockPostId, mockSiteId);

      expect(postDraftRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw exception when post not found', async () => {
      postRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteDraft(mockPostId, mockSiteId)).rejects.toThrow(BusinessException);
    });
  });

  describe('createDraftFromPost', () => {
    it('should return existing draft when it exists', async () => {
      postDraftRepository.findOne.mockResolvedValue(mockDraft);

      const result = await service.createDraftFromPost(mockPost as Post);

      expect(result).toEqual(mockDraft);
      expect(postDraftRepository.create).not.toHaveBeenCalled();
    });

    it('should create new draft from post when draft does not exist', async () => {
      postDraftRepository.findOne.mockResolvedValue(null);
      const createdDraft = {
        id: 'new-draft-123',
        postId: mockPost.id,
        title: mockPost.title,
        subtitle: mockPost.subtitle,
        contentJson: mockPost.contentJson,
        contentHtml: mockPost.contentHtml,
        contentText: mockPost.contentText,
        seoTitle: mockPost.seoTitle,
        seoDescription: mockPost.seoDescription,
        ogImageUrl: mockPost.ogImageUrl,
        categoryId: mockPost.categoryId,
      };
      postDraftRepository.create.mockReturnValue(createdDraft);
      postDraftRepository.save.mockResolvedValue(createdDraft);

      const result = await service.createDraftFromPost(mockPost as Post);

      expect(postDraftRepository.create).toHaveBeenCalledWith({
        postId: mockPost.id,
        title: mockPost.title,
        subtitle: mockPost.subtitle,
        contentJson: mockPost.contentJson,
        contentHtml: mockPost.contentHtml,
        contentText: mockPost.contentText,
        seoTitle: mockPost.seoTitle,
        seoDescription: mockPost.seoDescription,
        ogImageUrl: mockPost.ogImageUrl,
        categoryId: mockPost.categoryId,
      });
      expect(postDraftRepository.save).toHaveBeenCalledWith(createdDraft);
      expect(result).toEqual(createdDraft);
    });
  });

  describe('applyDraftToPost', () => {
    it('should apply draft content to post and delete draft', async () => {
      const postToUpdate = { ...mockPost };
      postRepository.findOne.mockResolvedValue(postToUpdate);
      postDraftRepository.findOne.mockResolvedValue(mockDraft);
      postRepository.save.mockImplementation((post) => Promise.resolve(post));

      const result = await service.applyDraftToPost(mockPostId, mockSiteId);

      expect(result.title).toBe(mockDraft.title);
      expect(result.subtitle).toBe(mockDraft.subtitle);
      expect(result.contentHtml).toBe(mockDraft.contentHtml);
      expect(result.status).toBe(PostStatus.PUBLISHED);
      expect(postDraftRepository.remove).toHaveBeenCalledWith(mockDraft);
    });

    it('should publish post without draft (no content change)', async () => {
      const postToUpdate = { ...mockPost, status: PostStatus.PRIVATE };
      postRepository.findOne.mockResolvedValue(postToUpdate);
      postDraftRepository.findOne.mockResolvedValue(null);
      postRepository.save.mockImplementation((post) => Promise.resolve(post));

      const result = await service.applyDraftToPost(mockPostId, mockSiteId);

      expect(result.status).toBe(PostStatus.PUBLISHED);
      expect(postDraftRepository.remove).not.toHaveBeenCalled();
    });

    it('should set publishedAt when first publishing', async () => {
      const postToUpdate = { ...mockPost, status: PostStatus.PRIVATE, publishedAt: null };
      postRepository.findOne.mockResolvedValue(postToUpdate);
      postDraftRepository.findOne.mockResolvedValue(null);
      postRepository.save.mockImplementation((post) => Promise.resolve(post));

      const result = await service.applyDraftToPost(mockPostId, mockSiteId);

      expect(result.publishedAt).toBeInstanceOf(Date);
    });

    it('should throw exception when post not found', async () => {
      postRepository.findOne.mockResolvedValue(null);

      await expect(service.applyDraftToPost(mockPostId, mockSiteId)).rejects.toThrow(
        BusinessException,
      );
    });
  });
});
