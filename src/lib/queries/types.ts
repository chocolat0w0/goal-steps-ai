import { type Project, type Category, type WeeklySettings, type TaskBlock } from '~/types';

export interface StorageAdapter {
  getProjects(): Project[];
  saveProjects(projects: Project[]): void;
  getCategories(projectId?: string): Category[];
  saveCategories(categories: Category[]): void;
  getWeeklySettings(projectId?: string): WeeklySettings[];
  saveWeeklySettings(settings: WeeklySettings[]): void;
  getTaskBlocks(projectId?: string): TaskBlock[];
  saveTaskBlocks(blocks: TaskBlock[]): void;
}