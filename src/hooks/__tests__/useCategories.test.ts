import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCategories } from '../useCategories';
import * as categoryService from '~/lib/category';
import { setupMockLocalStorage } from '~/test/mocks/localStorage';
import { mockProject, mockCategory } from '~/test/fixtures/testData';
import { type Category } from '~/types';

// CategoryServiceのモック
vi.mock('~/lib/category', () => ({
  CategoryService: {
    getCategoriesByProject: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    validateCategoryName: vi.fn(),
    validateValueRange: vi.fn(),
    validateMinUnit: vi.fn(),
    getProgress: vi.fn(),
  },
}));

describe('useCategories', () => {
  beforeEach(() => {
    setupMockLocalStorage();
    vi.clearAllMocks();
  });

  describe('初期化', () => {
    it('フックの初期状態が正しいこと', async () => {
      vi.mocked(CategoryService.getCategoriesByProject).mockReturnValue([]);

      const { result } = renderHook(() => useCategories(mockProject.id));

      expect(result.current.categories).toEqual([]);
      expect(typeof result.current.createCategory).toBe('function');
      expect(typeof result.current.updateCategory).toBe('function');
      expect(typeof result.current.deleteCategory).toBe('function');
      expect(typeof result.current.getCategoryProgress).toBe('function');
      expect(typeof result.current.refreshCategories).toBe('function');

      // ローディングが完了するまで待機
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('初期化時にプロジェクトのカテゴリーを読み込むこと', async () => {
      const mockCategories = [mockCategory];
      vi.mocked(CategoryService.getCategoriesByProject).mockReturnValue(mockCategories);

      const { result } = renderHook(() => useCategories(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(CategoryService.getCategoriesByProject).toHaveBeenCalledWith(mockProject.id);
      expect(result.current.categories).toEqual(mockCategories);
    });

    it('projectIdが変更された時に再読み込みすること', async () => {
      const newProjectId = 'new-project-id';
      vi.mocked(CategoryService.getCategoriesByProject).mockReturnValue([]);

      const { result, rerender } = renderHook(
        ({ projectId }) => useCategories(projectId),
        { initialProps: { projectId: mockProject.id } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(CategoryService.getCategoriesByProject).toHaveBeenCalledWith(mockProject.id);

      // projectIdを変更
      rerender({ projectId: newProjectId });

      await waitFor(() => {
        expect(CategoryService.getCategoriesByProject).toHaveBeenCalledWith(newProjectId);
      });
    });

    it('カテゴリー読み込みエラー時にローディングがfalseになること', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(CategoryService.getCategoriesByProject).mockImplementation(() => {
        throw new Error('Loading failed');
      });

      const { result } = renderHook(() => useCategories(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.categories).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load categories:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('createCategory', () => {
    beforeEach(() => {
      vi.mocked(CategoryService.getCategoriesByProject).mockReturnValue([]);
      vi.mocked(CategoryService.validateCategoryName).mockReturnValue(null);
      vi.mocked(CategoryService.validateValueRange).mockReturnValue(null);
      vi.mocked(CategoryService.validateMinUnit).mockReturnValue(null);
    });

    it('有効な入力でカテゴリーを作成できること', async () => {
      const newCategory = { ...mockCategory, id: 'new-category' };
      vi.mocked(CategoryService.createCategory).mockReturnValue(newCategory);

      const { result } = renderHook(() => useCategories(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdCategory: Category | null = null;
      await act(async () => {
        createdCategory = await result.current.createCategory(
          '新しいカテゴリー',
          { min: 10, max: 50 },
          '2030-12-15',
          5
        );
      });

      expect(createdCategory).toEqual(newCategory);
      expect(result.current.categories).toContain(newCategory);
      expect(CategoryService.createCategory).toHaveBeenCalledWith(
        mockProject.id,
        '新しいカテゴリー',
        { min: 10, max: 50 },
        '2030-12-15',
        5
      );
    });

    it('名前バリデーションエラー時にnullを返すこと', async () => {
      vi.mocked(CategoryService.validateCategoryName).mockReturnValue('カテゴリー名が無効です');

      const { result } = renderHook(() => useCategories(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdCategory: Category | null = null;
      await act(async () => {
        createdCategory = await result.current.createCategory(
          '',
          { min: 10, max: 50 },
          undefined,
          5
        );
      });

      expect(createdCategory).toBeNull();
      expect(CategoryService.createCategory).not.toHaveBeenCalled();
    });

    it('値範囲バリデーションエラー時にnullを返すこと', async () => {
      vi.mocked(CategoryService.validateValueRange).mockReturnValue('値範囲が無効です');

      const { result } = renderHook(() => useCategories(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdCategory: Category | null = null;
      await act(async () => {
        createdCategory = await result.current.createCategory(
          'テストカテゴリー',
          { min: 50, max: 10 },
          undefined,
          5
        );
      });

      expect(createdCategory).toBeNull();
      expect(CategoryService.createCategory).not.toHaveBeenCalled();
    });

    it('最小単位バリデーションエラー時にnullを返すこと', async () => {
      vi.mocked(CategoryService.validateMinUnit).mockReturnValue('最小単位が無効です');

      const { result } = renderHook(() => useCategories(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdCategory: Category | null = null;
      await act(async () => {
        createdCategory = await result.current.createCategory(
          'テストカテゴリー',
          { min: 10, max: 50 },
          undefined,
          100
        );
      });

      expect(createdCategory).toBeNull();
      expect(CategoryService.createCategory).not.toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    beforeEach(() => {
      vi.mocked(CategoryService.getCategoriesByProject).mockReturnValue([mockCategory]);
      vi.mocked(CategoryService.validateCategoryName).mockReturnValue(null);
      vi.mocked(CategoryService.validateValueRange).mockReturnValue(null);
      vi.mocked(CategoryService.validateMinUnit).mockReturnValue(null);
    });

    it('カテゴリーを更新できること', async () => {
      const updatedCategory = { ...mockCategory, name: '更新されたカテゴリー' };
      vi.mocked(CategoryService.updateCategory).mockReturnValue(updatedCategory);

      const { result } = renderHook(() => useCategories(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: Category | null = null;
      await act(async () => {
        updateResult = await result.current.updateCategory(mockCategory.id, {
          name: '更新されたカテゴリー'
        });
      });

      expect(updateResult).toEqual(updatedCategory);
      expect(result.current.categories).toContainEqual(updatedCategory);
      expect(CategoryService.updateCategory).toHaveBeenCalledWith(mockCategory.id, {
        name: '更新されたカテゴリー'
      });
    });

    it('更新失敗時にnullを返すこと', async () => {
      vi.mocked(CategoryService.updateCategory).mockReturnValue(null);

      const { result } = renderHook(() => useCategories(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: Category | null = null;
      await act(async () => {
        updateResult = await result.current.updateCategory('non-existent', {
          name: 'test'
        });
      });

      expect(updateResult).toBeNull();
    });

    it('名前バリデーションエラー時にnullを返すこと', async () => {
      vi.mocked(CategoryService.validateCategoryName).mockReturnValue('カテゴリー名が無効です');

      const { result } = renderHook(() => useCategories(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: Category | null = null;
      await act(async () => {
        updateResult = await result.current.updateCategory(mockCategory.id, {
          name: ''
        });
      });

      expect(updateResult).toBeNull();
      expect(CategoryService.updateCategory).not.toHaveBeenCalled();
    });

    it('値範囲とminUnitの組み合わせバリデーション時にnullを返すこと', async () => {
      vi.mocked(CategoryService.validateMinUnit).mockReturnValue('最小単位が無効です');

      const { result } = renderHook(() => useCategories(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: Category | null = null;
      await act(async () => {
        updateResult = await result.current.updateCategory(mockCategory.id, {
          valueRange: { min: 1, max: 10 },
          minUnit: 20
        });
      });

      expect(updateResult).toBeNull();
      expect(CategoryService.updateCategory).not.toHaveBeenCalled();
    });
  });

  describe('deleteCategory', () => {
    beforeEach(() => {
      vi.mocked(CategoryService.getCategoriesByProject).mockReturnValue([mockCategory]);
    });

    it('カテゴリーを削除できること', async () => {
      vi.mocked(CategoryService.deleteCategory).mockReturnValue(true);

      const { result } = renderHook(() => useCategories(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deleteResult: boolean = false;
      await act(async () => {
        deleteResult = await result.current.deleteCategory(mockCategory.id);
      });

      expect(deleteResult).toBe(true);
      expect(result.current.categories).not.toContainEqual(mockCategory);
      expect(CategoryService.deleteCategory).toHaveBeenCalledWith(mockCategory.id);
    });

    it('削除失敗時にfalseを返すこと', async () => {
      vi.mocked(CategoryService.deleteCategory).mockReturnValue(false);

      const { result } = renderHook(() => useCategories(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deleteResult: boolean = false;
      await act(async () => {
        deleteResult = await result.current.deleteCategory('non-existent');
      });

      expect(deleteResult).toBe(false);
      expect(result.current.categories).toContainEqual(mockCategory);
    });
  });

  describe('getCategoryProgress', () => {
    beforeEach(() => {
      vi.mocked(CategoryService.getCategoriesByProject).mockReturnValue([mockCategory]);
    });

    it('カテゴリーの進捗を取得できること', async () => {
      const mockProgress = { completed: 5, total: 10, percentage: 50 };
      vi.mocked(CategoryService.getProgress).mockReturnValue(mockProgress);

      const { result } = renderHook(() => useCategories(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const progress = result.current.getCategoryProgress(mockCategory);

      expect(progress).toEqual(mockProgress);
      expect(CategoryService.getProgress).toHaveBeenCalledWith(mockCategory);
    });
  });

  describe('refreshCategories', () => {
    it('カテゴリーリストを再読み込みできること', async () => {
      const initialCategories = [mockCategory];
      const updatedCategories = [mockCategory, { ...mockCategory, id: 'category-2' }];
      
      vi.mocked(CategoryService.getCategoriesByProject)
        .mockReturnValueOnce(initialCategories)
        .mockReturnValueOnce(updatedCategories);

      const { result } = renderHook(() => useCategories(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.categories).toEqual(initialCategories);

      await act(async () => {
        result.current.refreshCategories();
      });

      expect(result.current.categories).toEqual(updatedCategories);
      expect(CategoryService.getCategoriesByProject).toHaveBeenCalledTimes(2);
    });
  });
});