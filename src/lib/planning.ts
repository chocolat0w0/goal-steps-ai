import {
  type Project,
  type Category,
  type WeeklySettings,
  type TaskBlock,
} from '~/types';
import { validatePlanningData } from './validators/planning';
import { generatePlan, type PlanningOptions } from './queries/planning';
import {
  getDayKeyFromDayOfWeek,
  getAvailableDates,
  calculateDailyCapacities,
} from './utils/planning';
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

export {
  generateId,
  getCurrentTimestamp,
  getDayKeyFromDayOfWeek,
  getAvailableDates,
  calculateDailyCapacities,
  validatePlanningData,
  type PlanningOptions,
};
