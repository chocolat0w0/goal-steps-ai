import { type Project, type Category, type WeeklySettings, type TaskBlock } from '~/types';
import { validatePlanningData } from './validators/planning';
import {
  generatePlan,
  createTaskBlocksForCategory,
  type PlanningOptions
} from './queries/planning';
import {
  getDayKeyFromDayOfWeek,
  getAvailableDates,
  calculateDailyCapacities,
  getEstimatedCompletionDate
} from './utils/planning';
import { getTotalWeeklyCapacity } from './utils/weeklySettings';
import { generateId, getCurrentTimestamp } from './utils/common';
import { createStorageAdapter } from './queries/storage';

const storage = createStorageAdapter();

export function createPlan(
  project: Project,
  categories: Category[],
  weeklySettings: WeeklySettings,
  options: PlanningOptions = {
    respectCategoryDeadlines: true,
    prioritizeWeeklyDistribution: true,
  }
): TaskBlock[] {
  return generatePlan(storage, project, categories, weeklySettings, options);
}

export function estimateCompletionDate(
  totalUnits: number,
  weeklySettings: WeeklySettings,
  startDate: Date = new Date()
): Date | null {
  const weeklyCapacity = getTotalWeeklyCapacity(weeklySettings);
  return getEstimatedCompletionDate(totalUnits, weeklyCapacity, startDate);
}

export {
  generateId,
  getCurrentTimestamp,
  getDayKeyFromDayOfWeek,
  getAvailableDates,
  calculateDailyCapacities,
  validatePlanningData,
  createTaskBlocksForCategory,
  type PlanningOptions
};