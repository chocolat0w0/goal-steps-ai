import { type Project, type Category, type WeeklySettings, type TaskBlock } from '~/types';

const STORAGE_KEYS = {
  PROJECTS: 'goal-steps-projects',
  CATEGORIES: 'goal-steps-categories',
  WEEKLY_SETTINGS: 'goal-steps-weekly-settings',
  TASK_BLOCKS: 'goal-steps-task-blocks',
} as const;

export class Storage {
  static getProjects(): Project[] {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  }

  static saveProjects(projects: Project[]): void {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }

  static getCategories(projectId?: string): Category[] {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    const categories = data ? JSON.parse(data) : [];
    return projectId
      ? categories.filter((cat: Category) => cat.projectId === projectId)
      : categories;
  }

  static saveCategories(categories: Category[]): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }

  static getWeeklySettings(projectId?: string): WeeklySettings[] {
    const data = localStorage.getItem(STORAGE_KEYS.WEEKLY_SETTINGS);
    const settings = data ? JSON.parse(data) : [];
    return projectId
      ? settings.filter((setting: WeeklySettings) => setting.projectId === projectId)
      : settings;
  }

  static saveWeeklySettings(settings: WeeklySettings[]): void {
    localStorage.setItem(STORAGE_KEYS.WEEKLY_SETTINGS, JSON.stringify(settings));
  }

  static getTaskBlocks(projectId?: string): TaskBlock[] {
    const data = localStorage.getItem(STORAGE_KEYS.TASK_BLOCKS);
    const blocks = data ? JSON.parse(data) : [];
    return projectId
      ? blocks.filter((block: TaskBlock) => block.projectId === projectId)
      : blocks;
  }

  static saveTaskBlocks(blocks: TaskBlock[]): void {
    localStorage.setItem(STORAGE_KEYS.TASK_BLOCKS, JSON.stringify(blocks));
  }

  static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}