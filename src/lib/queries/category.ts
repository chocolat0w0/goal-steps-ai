import { type Category } from '~/types';
import { type StorageAdapter } from './types';
import { generateId } from '~/lib/utils/common';
import { getTotalUnits, calculateProgress } from '~/lib/utils/category';

export function createCategory(
  storage: StorageAdapter,
  projectId: string,
  name: string,
  valueRange: { min: number; max: number },
  deadline: string | undefined,
  minUnit: number
): Category {
  const category: Category = {
    id: generateId(),
    projectId,
    name: name.trim(),
    valueRange,
    deadline: deadline || undefined,
    minUnit,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const categories = storage.getCategories();
  categories.push(category);
  storage.saveCategories(categories);

  return category;
}

export function updateCategory(
  storage: StorageAdapter,
  id: string,
  updates: Partial<Pick<Category, 'name' | 'valueRange' | 'deadline' | 'minUnit'>>
): Category | null {
  const categories = storage.getCategories();
  const index = categories.findIndex(c => c.id === id);
  
  if (index === -1) {
    return null;
  }

  const updatedCategory: Category = {
    ...categories[index],
    ...updates,
  };

  categories[index] = updatedCategory;
  storage.saveCategories(categories);

  return updatedCategory;
}

export function deleteCategory(storage: StorageAdapter, id: string): boolean {
  const categories = storage.getCategories();
  const index = categories.findIndex(c => c.id === id);
  
  if (index === -1) {
    return false;
  }

  categories.splice(index, 1);
  storage.saveCategories(categories);

  const taskBlocks = storage.getTaskBlocks().filter(t => t.categoryId !== id);
  storage.saveTaskBlocks(taskBlocks);

  return true;
}

export function getCategory(storage: StorageAdapter, id: string): Category | null {
  const categories = storage.getCategories();
  return categories.find(c => c.id === id) || null;
}

export function getCategoriesByProject(storage: StorageAdapter, projectId: string): Category[] {
  return storage.getCategories(projectId);
}

export function getCategoryProgress(
  storage: StorageAdapter, 
  category: Category
): { completed: number; total: number; percentage: number } {
  const taskBlocks = storage.getTaskBlocks().filter(t => t.categoryId === category.id);
  const completedBlocks = taskBlocks.filter(t => t.completed);
  const total = getTotalUnits(category);
  const completed = completedBlocks.length;
  return calculateProgress(completed, total);
}