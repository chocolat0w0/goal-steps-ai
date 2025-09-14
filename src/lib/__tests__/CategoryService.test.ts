import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
  getCategoriesForProject,
  getProgress,
  validateCategoryName,
  validateValueRange,
  validateMinUnit,
  getTotalUnits,
} from '../category';
import { validateDeadline as validateCategoryDeadline } from '../validators/category';
import {
  setupMockLocalStorage,
  getStorageKey,
} from '~/test/mocks/localStorage';
import { mockCategory, mockProject } from '~/test/fixtures/testData';
import { type Category } from '~/types';

describe('CategoryService', () => {
  let mockStorage: ReturnType<typeof setupMockLocalStorage>;

  beforeEach(() => {
    mockStorage = setupMockLocalStorage();
  });

  describe('createCategory', () => {
    it('新しいカテゴリーを作成できること', () => {
      const categoryData = {
        projectId: mockProject.id,
        name: 'テストカテゴリー',
        valueRange: { min: 10, max: 50 },
        deadline: '2024-12-15',
        minUnit: 5,
      };

      const result = createCategory(
        categoryData.projectId,
        categoryData.name,
        categoryData.valueRange,
        categoryData.deadline,
        categoryData.minUnit
      );

      expect(result).toBeTruthy();
      expect(result.projectId).toBe(categoryData.projectId);
      expect(result.name).toBe(categoryData.name);
      expect(result.valueRange).toEqual(categoryData.valueRange);
      expect(result.deadline).toBe(categoryData.deadline);
      expect(result.minUnit).toBe(categoryData.minUnit);
      expect(result.id).toBeDefined();
    });

    it('作成したカテゴリーがlocalStorageに保存されること', () => {
      const result = createCategory(
        mockProject.id,
        'テストカテゴリー',
        { min: 10, max: 50 },
        '2024-12-15',
        5
      );

      expect(result).toBeTruthy();

      const storedCategories = JSON.parse(
        mockStorage.getItem(getStorageKey('categories')) || '[]'
      );
      expect(storedCategories).toHaveLength(1);
      expect(storedCategories[0].id).toBe(result.id);
    });
  });

  describe('getCategoriesForProject', () => {
    it('空の配列を返すこと（初期状態）', () => {
      const categories = getCategoriesForProject(mockProject.id);
      expect(categories).toEqual([]);
    });

    it('指定されたプロジェクトのカテゴリーを取得できること', () => {
      const storedCategories = [mockCategory];
      mockStorage.setItem(
        getStorageKey('categories'),
        JSON.stringify(storedCategories)
      );

      const categories = getCategoriesForProject(mockProject.id);

      expect(categories).toHaveLength(1);
      expect(categories[0]).toEqual(mockCategory);
    });

    it('他のプロジェクトのカテゴリーは除外されること', () => {
      const otherCategory: Category = {
        ...mockCategory,
        id: 'other-category',
        projectId: 'other-project-id',
      };
      const storedCategories = [mockCategory, otherCategory];
      mockStorage.setItem(
        getStorageKey('categories'),
        JSON.stringify(storedCategories)
      );

      const categories = getCategoriesForProject(mockProject.id);

      expect(categories).toHaveLength(1);
      expect(categories[0]).toEqual(mockCategory);
    });
  });

  describe('getCategoryById', () => {
    beforeEach(() => {
      const storedCategories = [mockCategory];
      mockStorage.setItem(
        getStorageKey('categories'),
        JSON.stringify(storedCategories)
      );
    });

    it('IDで指定したカテゴリーを取得できること', () => {
      const category = getCategoryById(mockCategory.id);

      expect(category).toEqual(mockCategory);
    });

    it('存在しないIDの場合はnullを返すこと', () => {
      const category = getCategoryById('non-existent-id');

      expect(category).toBeNull();
    });
  });

  describe('updateCategory', () => {
    beforeEach(() => {
      const storedCategories = [mockCategory];
      mockStorage.setItem(
        getStorageKey('categories'),
        JSON.stringify(storedCategories)
      );
    });

    it('カテゴリーを更新できること', () => {
      const updates = {
        name: '更新されたカテゴリー名',
        valueRange: { min: 20, max: 100 },
        deadline: '2024-11-30',
        minUnit: 10,
      };

      const result = updateCategory(mockCategory.id, updates);

      expect(result).toBeTruthy();
      expect(result?.name).toBe(updates.name);
      expect(result?.valueRange).toEqual(updates.valueRange);
      expect(result?.deadline).toBe(updates.deadline);
      expect(result?.minUnit).toBe(updates.minUnit);
    });

    it('更新後のカテゴリーがlocalStorageに保存されること', () => {
      const updates = { name: '更新されたカテゴリー名' };

      updateCategory(mockCategory.id, updates);

      const storedCategories = JSON.parse(
        mockStorage.getItem(getStorageKey('categories')) || '[]'
      );
      expect(storedCategories[0].name).toBe(updates.name);
    });

    it('存在しないIDの場合はnullを返すこと', () => {
      const result = updateCategory('non-existent-id', { name: 'test' });

      expect(result).toBeNull();
    });
  });

  describe('deleteCategory', () => {
    beforeEach(() => {
      const storedCategories = [mockCategory];
      mockStorage.setItem(
        getStorageKey('categories'),
        JSON.stringify(storedCategories)
      );
    });

    it('カテゴリーを削除できること', () => {
      const result = deleteCategory(mockCategory.id);

      expect(result).toBe(true);
    });

    it('削除後にカテゴリーがlocalStorageから削除されること', () => {
      deleteCategory(mockCategory.id);

      const storedCategories = JSON.parse(
        mockStorage.getItem(getStorageKey('categories')) || '[]'
      );
      expect(storedCategories).toHaveLength(0);
    });

    it('存在しないIDの場合はfalseを返すこと', () => {
      const result = deleteCategory('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('バリデーション機能', () => {
    it('カテゴリー名のバリデーションが正しく動作すること', () => {
      expect(validateCategoryName('')).toBeTruthy();
      expect(validateCategoryName('OK')).toBeNull();
    });

    it('値範囲のバリデーションが正しく動作すること', () => {
      expect(validateValueRange(10, 5)).toBeTruthy();
      expect(validateValueRange(10, 50)).toBeNull();
    });

    it('最小単位のバリデーションが正しく動作すること', () => {
      expect(validateMinUnit(-1, 50)).toBeTruthy();
      expect(validateMinUnit(5, 50)).toBeNull();
    });

    it('期限のバリデーションが正しく動作すること', () => {
      expect(validateCategoryDeadline('2020-01-01', '2030-12-31')).toBeTruthy();
      expect(validateCategoryDeadline('2030-06-15', '2030-12-31')).toBeNull();
    });
  });

  describe('ユーティリティ機能', () => {
    it('進捗計算が正しく動作すること', () => {
      const progress = getProgress(mockCategory);

      expect(progress).toHaveProperty('completed');
      expect(progress).toHaveProperty('total');
      expect(progress).toHaveProperty('percentage');
      expect(typeof progress.completed).toBe('number');
      expect(typeof progress.total).toBe('number');
      expect(typeof progress.percentage).toBe('number');
    });

    it('総単位数計算が正しく動作すること', () => {
      const totalUnits = getTotalUnits(mockCategory);

      expect(typeof totalUnits).toBe('number');
      expect(totalUnits).toBeGreaterThan(0);
    });
  });
});
