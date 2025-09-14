import { type Category } from '~/types';
import {
  validateCategoryName,
  validateValueRange,
  validateMinUnit,
  validateDeadline as validateCategoryDeadline,
} from './validators/category';
import {
  createCategory as createCategoryQuery,
  updateCategory as updateCategoryQuery,
  deleteCategory as deleteCategoryQuery,
  getCategory,
  getCategoriesByProject,
  getCategoryProgress,
} from './queries/category';
import { getTotalUnits } from './utils/category';
import { generateId } from './utils/common';
import { createStorageAdapter } from './queries/storage';

const storage = createStorageAdapter();

export function createCategory(
  projectId: string,
  name: string,
  valueRange: { min: number; max: number },
  deadline: string | undefined,
  minUnit: number
): Category {
  return createCategoryQuery(
    storage,
    projectId,
    name,
    valueRange,
    deadline,
    minUnit
  );
}

export function updateCategory(
  id: string,
  updates: Partial<
    Pick<Category, 'name' | 'valueRange' | 'deadline' | 'minUnit'>
  >
): Category | null {
  return updateCategoryQuery(storage, id, updates);
}

export function deleteCategory(id: string): boolean {
  return deleteCategoryQuery(storage, id);
}

export function getCategoryById(id: string): Category | null {
  return getCategory(storage, id);
}

export function getCategoriesForProject(projectId: string): Category[] {
  return getCategoriesByProject(storage, projectId);
}

export function getProgress(category: Category): {
  completed: number;
  total: number;
  percentage: number;
} {
  return getCategoryProgress(storage, category);
}

export {
  generateId,
  validateCategoryName,
  validateValueRange,
  validateMinUnit,
  validateCategoryDeadline,
  getTotalUnits,
};
