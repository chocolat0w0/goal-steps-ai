import { type Category } from '~/types';
import { Storage } from './storage';

export class CategoryService {
  static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static createCategory(
    projectId: string,
    name: string,
    valueRange: { min: number; max: number },
    deadline: string | undefined,
    minUnit: number
  ): Category {
    const category: Category = {
      id: this.generateId(),
      projectId,
      name: name.trim(),
      valueRange,
      deadline: deadline || undefined,
      minUnit,
    };

    const categories = Storage.getCategories();
    categories.push(category);
    Storage.saveCategories(categories);

    return category;
  }

  static updateCategory(
    id: string,
    updates: Partial<Pick<Category, 'name' | 'valueRange' | 'deadline' | 'minUnit'>>
  ): Category | null {
    const categories = Storage.getCategories();
    const index = categories.findIndex(c => c.id === id);
    
    if (index === -1) {
      return null;
    }

    const updatedCategory: Category = {
      ...categories[index],
      ...updates,
    };

    categories[index] = updatedCategory;
    Storage.saveCategories(categories);

    return updatedCategory;
  }

  static deleteCategory(id: string): boolean {
    const categories = Storage.getCategories();
    const index = categories.findIndex(c => c.id === id);
    
    if (index === -1) {
      return false;
    }

    categories.splice(index, 1);
    Storage.saveCategories(categories);

    // 関連するタスクブロックも削除
    const taskBlocks = Storage.getTaskBlocks().filter(t => t.categoryId !== id);
    Storage.saveTaskBlocks(taskBlocks);

    return true;
  }

  static getCategory(id: string): Category | null {
    const categories = Storage.getCategories();
    return categories.find(c => c.id === id) || null;
  }

  static getCategoriesByProject(projectId: string): Category[] {
    return Storage.getCategories(projectId);
  }

  static validateCategoryName(name: string): string | null {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return 'カテゴリー名を入力してください';
    }
    
    if (trimmedName.length < 2) {
      return 'カテゴリー名は2文字以上で入力してください';
    }
    
    if (trimmedName.length > 30) {
      return 'カテゴリー名は30文字以内で入力してください';
    }
    
    return null;
  }

  static validateValueRange(min: number, max: number): string | null {
    if (min <= 0 || max <= 0) {
      return '値は1以上で入力してください';
    }

    if (min > max) {
      return '最大値は最小値以上で入力してください';
    }

    if (max - min > 10000) {
      return '範囲が大きすぎます（最大10000まで）';
    }

    return null;
  }

  static validateMinUnit(minUnit: number, max: number): string | null {
    if (minUnit <= 0) {
      return '最小単位は1以上で入力してください';
    }

    if (minUnit > max) {
      return '最小単位は最大値以下で入力してください';
    }

    return null;
  }

  static validateDeadline(deadline: string | undefined, projectDeadline: string): string | null {
    if (!deadline) {
      return null; // 期限は任意
    }

    const deadlineDate = new Date(deadline);
    const projectDeadlineDate = new Date(projectDeadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (deadlineDate < today) {
      return '期限は今日以降の日付を設定してください';
    }

    if (deadlineDate > projectDeadlineDate) {
      return 'プロジェクトの期限以前の日付を設定してください';
    }

    return null;
  }

  static getTotalUnits(category: Category): number {
    return Math.ceil((category.valueRange.max - category.valueRange.min + 1) / category.minUnit);
  }

  static getProgress(category: Category): { completed: number; total: number; percentage: number } {
    const taskBlocks = Storage.getTaskBlocks().filter(t => t.categoryId === category.id);
    const completedBlocks = taskBlocks.filter(t => t.completed);
    const total = this.getTotalUnits(category);
    const completed = completedBlocks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }
}