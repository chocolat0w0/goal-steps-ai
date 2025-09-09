import { useState, useEffect } from 'react';
import { type Category } from '~/types';
import { CategoryService } from '~/lib/categoryService';

export function useCategories(projectId: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, [projectId]);

  const loadCategories = () => {
    try {
      const loadedCategories = CategoryService.getCategoriesByProject(projectId);
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = (
    name: string,
    valueRange: { min: number; max: number },
    deadline: string | undefined,
    minUnit: number
  ): Promise<Category | null> => {
    return new Promise((resolve) => {
      try {
        const nameError = CategoryService.validateCategoryName(name);
        if (nameError) {
          throw new Error(nameError);
        }

        const rangeError = CategoryService.validateValueRange(valueRange.min, valueRange.max);
        if (rangeError) {
          throw new Error(rangeError);
        }

        const unitError = CategoryService.validateMinUnit(minUnit, valueRange.max);
        if (unitError) {
          throw new Error(unitError);
        }

        const newCategory = CategoryService.createCategory(
          projectId,
          name,
          valueRange,
          deadline,
          minUnit
        );
        setCategories(prev => [...prev, newCategory]);
        resolve(newCategory);
      } catch (error) {
        console.error('Failed to create category:', error);
        resolve(null);
      }
    });
  };

  const updateCategory = (
    id: string,
    updates: Partial<Pick<Category, 'name' | 'valueRange' | 'deadline' | 'minUnit'>>
  ): Promise<Category | null> => {
    return new Promise((resolve) => {
      try {
        if (updates.name !== undefined) {
          const nameError = CategoryService.validateCategoryName(updates.name);
          if (nameError) {
            throw new Error(nameError);
          }
        }

        if (updates.valueRange !== undefined) {
          const rangeError = CategoryService.validateValueRange(
            updates.valueRange.min,
            updates.valueRange.max
          );
          if (rangeError) {
            throw new Error(rangeError);
          }
        }

        if (updates.minUnit !== undefined && updates.valueRange !== undefined) {
          const unitError = CategoryService.validateMinUnit(
            updates.minUnit,
            updates.valueRange.max
          );
          if (unitError) {
            throw new Error(unitError);
          }
        }

        const updatedCategory = CategoryService.updateCategory(id, updates);
        if (updatedCategory) {
          setCategories(prev =>
            prev.map(c => c.id === id ? updatedCategory : c)
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
        const success = CategoryService.deleteCategory(id);
        if (success) {
          setCategories(prev => prev.filter(c => c.id !== id));
        }
        resolve(success);
      } catch (error) {
        console.error('Failed to delete category:', error);
        resolve(false);
      }
    });
  };

  const getCategoryProgress = (category: Category) => {
    return CategoryService.getProgress(category);
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