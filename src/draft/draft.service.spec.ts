import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DraftService } from './draft.service';
import { PostService } from '../post/post.service';
import { Draft } from './entities/draft.entity';
import { Post, PostStatus } from '../post/entities/post.entity';
import { DraftImageService } from './draft-image.service';
import { BusinessException } from '../common/exception/business.exception';

describe('DraftService', () => {
  let service: DraftService;
  let draftRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    remove: jest.Mock;
  };
  let postService: {
    isSlugAvailable: jest.Mock;
    createPost: jest.Mock;
  };
  let draftImageService: {
    syncImages: jest.Mock;
    transferToPost: jest.Mock;
  };

  const mockSiteId = 'site-123';
  const mockUserId = 'user-123';

  const mockDraft: Partial<Draft> = {
    id: 'draft-123',
    siteId: mockSiteId,
    userId: mockUserId,
    title: 'Draft Title',
    subtitle: 'Draft Subtitle',
    slug: 'draft-slug',
    contentJson: { type: 'doc', content: [{ type: 'paragraph' }] },
    contentHtml: '<p>Draft content</p>',
    contentText: 'Draft content',
    seoTitle: 'Draft SEO Title',
    seoDescription: 'Draft SEO Description',
    ogImageUrl: 'https://example.com/draft-image.jpg',
    categoryId: 'category-456',
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPost: Partial<Post> = {
    id: 'post-123',
    siteId: mockSiteId,
    userId: mockUserId,
    title: 'Draft Title',
    subtitle: 'Draft Subtitle',
    slug: 'draft-slug',
    contentJson: { type: 'doc', content: [{ type: 'paragraph' }] },
    contentHtml: '<p>Draft content</p>',
    contentText: 'Draft content',
    status: PostStatus.PUBLISHED,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    draftRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };

    postService = {
      isSlugAvailable: jest.fn(),
      createPost: jest.fn(),
    };

    draftImageService = {
      syncImages: jest.fn().mockResolvedValue(undefined),
      transferToPost: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DraftService,
        {
          provide: getRepositoryToken(Draft),
          useValue: draftRepository,
        },
        {
          provide: PostService,
          useValue: postService,
        },
        {
          provide: DraftImageService,
          useValue: draftImageService,
        },
      ],
    }).compile();

    service = module.get<DraftService>(DraftService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findBySiteId', () => {
    it('should return drafts for the site and user', async () => {
      const drafts = [mockDraft];
      draftRepository.find.mockResolvedValue(drafts);

      const result = await service.findBySiteId(mockSiteId, mockUserId);

      expect(result).toEqual(drafts);
      expect(draftRepository.find).toHaveBeenCalledWith({
        where: { siteId: mockSiteId, userId: mockUserId },
        relations: ['category'],
        order: { updatedAt: 'DESC' },
      });
    });

    it('should return empty array when no drafts exist', async () => {
      draftRepository.find.mockResolvedValue([]);

      const result = await service.findBySiteId(mockSiteId, mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return draft when it exists', async () => {
      draftRepository.findOne.mockResolvedValue(mockDraft);

      const result = await service.findById('draft-123');

      expect(result).toEqual(mockDraft);
      expect(draftRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'draft-123' },
        relations: ['category'],
      });
    });

    it('should return null when draft does not exist', async () => {
      draftRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createDraft', () => {
    it('should create a new draft', async () => {
      const dto = {
        title: 'New Draft',
        subtitle: 'New Subtitle',
        contentJson: { type: 'doc', content: [] },
      };
      const createdDraft = { ...mockDraft, ...dto, id: 'new-draft-123' };
      draftRepository.create.mockReturnValue(createdDraft);
      draftRepository.save.mockResolvedValue(createdDraft);

      const result = await service.createDraft(mockSiteId, mockUserId, dto);

      expect(draftRepository.create).toHaveBeenCalled();
      expect(draftRepository.save).toHaveBeenCalled();
      expect(draftImageService.syncImages).toHaveBeenCalled();
      expect(result.title).toBe('New Draft');
    });

    it('should set default values for optional fields', async () => {
      const dto = { title: 'Minimal Draft' };
      const createdDraft = { ...mockDraft, title: 'Minimal Draft', id: 'new-draft-123' };
      draftRepository.create.mockReturnValue(createdDraft);
      draftRepository.save.mockResolvedValue(createdDraft);

      await service.createDraft(mockSiteId, mockUserId, dto);

      expect(draftRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          siteId: mockSiteId,
          userId: mockUserId,
          title: 'Minimal Draft',
        }),
      );
    });
  });

  describe('updateDraft', () => {
    it('should update draft when it exists', async () => {
      const dto = { title: 'Updated Title' };
      draftRepository.findOne.mockResolvedValue({ ...mockDraft });
      draftRepository.save.mockImplementation((draft) => Promise.resolve(draft));

      const result = await service.updateDraft('draft-123', mockSiteId, mockUserId, dto);

      expect(result.title).toBe('Updated Title');
      expect(draftImageService.syncImages).toHaveBeenCalled();
    });

    it('should throw exception when draft not found', async () => {
      draftRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateDraft('nonexistent', mockSiteId, mockUserId, { title: 'Test' }),
      ).rejects.toThrow(BusinessException);
    });

    it('should only update provided fields', async () => {
      const original = { ...mockDraft };
      draftRepository.findOne.mockResolvedValue(original);
      draftRepository.save.mockImplementation((draft) => Promise.resolve(draft));

      await service.updateDraft('draft-123', mockSiteId, mockUserId, { title: 'New Title' });

      expect(original.title).toBe('New Title');
      expect(original.subtitle).toBe(mockDraft.subtitle); // unchanged
    });
  });

  describe('deleteDraft', () => {
    it('should delete draft when it exists', async () => {
      draftRepository.findOne.mockResolvedValue(mockDraft);

      await service.deleteDraft('draft-123', mockSiteId, mockUserId);

      expect(draftRepository.remove).toHaveBeenCalledWith(mockDraft);
    });

    it('should throw exception when draft not found', async () => {
      draftRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteDraft('nonexistent', mockSiteId, mockUserId)).rejects.toThrow(
        BusinessException,
      );
    });
  });

  // publishDraft tests are skipped because @Transactional decorator
  // requires a real database connection. These should be tested in e2e tests.
  describe('publishDraft', () => {
    it.todo('should publish draft as a new post (requires e2e test with real DB)');
    it.todo('should throw exception when draft not found (requires e2e test with real DB)');
    it.todo('should throw exception when slug already exists (requires e2e test with real DB)');
  });

  describe('cleanupExpiredDrafts', () => {
    it('should remove expired drafts', async () => {
      const expiredDrafts = [mockDraft, { ...mockDraft, id: 'draft-456' }];
      draftRepository.find.mockResolvedValue(expiredDrafts);

      const result = await service.cleanupExpiredDrafts();

      expect(result).toBe(2);
      expect(draftRepository.remove).toHaveBeenCalledTimes(2);
    });

    it('should return 0 when no expired drafts', async () => {
      draftRepository.find.mockResolvedValue([]);

      const result = await service.cleanupExpiredDrafts();

      expect(result).toBe(0);
      expect(draftRepository.remove).not.toHaveBeenCalled();
    });
  });
});
