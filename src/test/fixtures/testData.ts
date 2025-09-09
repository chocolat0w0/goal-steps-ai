import { type Project, type Category, type TaskBlock, type WeeklySettings } from '~/types';

export const mockProject: Project = {
  id: 'test-project-1',
  name: 'テストプロジェクト',
  deadline: '2030-12-31',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

export const mockCategory: Category = {
  id: 'test-category-1',
  projectId: 'test-project-1',
  name: 'テストカテゴリー',
  valueRange: { min: 10, max: 50 },
  deadline: '2030-12-15',
  minUnit: 5
};

export const mockCategories: Category[] = [
  mockCategory,
  {
    ...mockCategory,
    id: 'test-category-2',
    name: 'テストカテゴリー2',
    valueRange: { min: 20, max: 100 },
    deadline: '2030-11-30',
    minUnit: 10
  }
];

export const mockWeeklySettings: WeeklySettings = {
  id: 'test-weekly-1',
  projectId: 'test-project-1',
  monday: 'high',
  tuesday: 'normal',
  wednesday: 'low',
  thursday: 'normal',
  friday: 'high',
  saturday: 'low',
  sunday: 'none'
};

export const mockTaskBlock: TaskBlock = {
  id: 'test-task-1',
  categoryId: 'test-category-1',
  amount: 15,
  completed: false,
  date: '2030-06-15'
};

export const mockTaskBlocks: TaskBlock[] = [
  mockTaskBlock,
  {
    ...mockTaskBlock,
    id: 'test-task-2',
    amount: 20,
    completed: true,
    date: '2030-06-16'
  },
  {
    ...mockTaskBlock,
    id: 'test-task-3',
    categoryId: 'test-category-2',
    amount: 25,
    date: '2030-06-17'
  }
];