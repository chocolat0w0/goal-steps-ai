import { useState, useEffect, useCallback } from 'react';
import { type Category } from '~/types';
import {
  createCategory as createCategoryFn,
  updateCategory as updateCategoryFn,
  deleteCategory as deleteCategoryFn,
  getCategoriesForProject,
  getProgress,
  validateCategoryName,
  validateValueRange,
  validateMinUnit,
} from '~/lib/category';

export function useCategories(projectId: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(() => {
    try {
      const loadedCategories = getCategoriesForProject(projectId);
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const createCategory = (
    name: string,
    valueRange: { min: number; max: number },
    deadline: string | undefined,
    minUnit: number
  ): Promise<Category | null> => {
    return new Promise((resolve) => {
      try {
        const nameError = validateCategoryName(name);
        if (nameError) {
          throw new Error(nameError);
        }

        const rangeError = validateValueRange(valueRange.min, valueRange.max);
        if (rangeError) {
          throw new Error(rangeError);
        }

        const unitError = validateMinUnit(minUnit, valueRange.max);
        if (unitError) {
          throw new Error(unitError);
        }

        const newCategory = createCategoryFn(
          projectId,
          name,
          valueRange,
          deadline,
          minUnit
        );
        setCategories((prev) => [...prev, newCategory]);
        resolve(newCategory);
      } catch (error) {
        console.error('Failed to create category:', error);
        resolve(null);
      }
    });
  };

  const updateCategory = (
    id: string,
    updates: Partial<
      Pick<Category, 'name' | 'valueRange' | 'deadline' | 'minUnit'>
    >
  ): Promise<Category | null> => {
    return new Promise((resolve) => {
      try {
        if (updates.name !== undefined) {
          const nameError = validateCategoryName(updates.name);
          if (nameError) {
            throw new Error(nameError);
          }
        }

        if (updates.valueRange !== undefined) {
          const rangeError = validateValueRange(
            updates.valueRange.min,
            updates.valueRange.max
          );
          if (rangeError) {
            throw new Error(rangeError);
          }
        }

        if (updates.minUnit !== undefined && updates.valueRange !== undefined) {
          const unitError = validateMinUnit(
            updates.minUnit,
            updates.valueRange.max
          );
          if (unitError) {
            throw new Error(unitError);
          }
        }

        const updatedCategory = updateCategoryFn(id, updates);
        if (updatedCategory) {
          setCategories((prev) =>
            prev.map((c) => (c.id === id ? updatedCategory : c))
          );
        }
        resolve(updatedCategory);
      } catch (error) {
        console.error('Failed to update category:', error);
        resolve(null);
      }
    });
  };

  const deleteCategory = (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const success = deleteCategoryFn(id);
        if (success) {
          setCategories((prev) => prev.filter((c) => c.id !== id));
        }
        resolve(success);
      } catch (error) {
        console.error('Failed to delete category:', error);
        resolve(false);
      }
    });
  };

  const getCategoryProgress = (category: Category) => {
    return getProgress(category);
  };

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryProgress,
    refreshCategories: loadCategories,
  };
}
