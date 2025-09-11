import { type Project, type Category, type WeeklySettings, type TaskBlock } from '~/types';
import { type StorageAdapter } from './types';
import { generateId, getCurrentTimestamp } from '~/lib/utils/common';
import { getTotalUnits } from '~/lib/utils/category';
import { getAvailableDates, calculateDailyCapacities } from '~/lib/utils/planning';

export interface PlanningOptions {
  respectCategoryDeadlines: boolean;
  prioritizeWeeklyDistribution: boolean;
}

export function generatePlan(
  storage: StorageAdapter,
  project: Project,
  categories: Category[],
  weeklySettings: WeeklySettings,
  options: PlanningOptions = {
    respectCategoryDeadlines: true,
    prioritizeWeeklyDistribution: true,
  }
): TaskBlock[] {
  storage.saveTaskBlocks(storage.getTaskBlocks().filter(t => t.projectId !== project.id));

  const taskBlocks: TaskBlock[] = [];
  const projectDeadline = new Date(project.deadline);
  
  for (const category of categories) {
    const categoryBlocks = createTaskBlocksForCategory(
      storage,
      category,
      project,
      weeklySettings,
      projectDeadline,
      options
    );
    taskBlocks.push(...categoryBlocks);
  }

  taskBlocks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  storage.saveTaskBlocks(taskBlocks);

  return taskBlocks;
}

export function createTaskBlocksForCategory(
  storage: StorageAdapter,
  category: Category,
  project: Project,
  weeklySettings: WeeklySettings,
  projectDeadline: Date,
  options: PlanningOptions
): TaskBlock[] {
  const blocks: TaskBlock[] = [];
  const totalUnits = getTotalUnits(category);
  
  const categoryDeadline = category.deadline 
    ? new Date(category.deadline)
    : projectDeadline;
  
  if (options.respectCategoryDeadlines && category.deadline) {
    categoryDeadline.setTime(Math.min(categoryDeadline.getTime(), projectDeadline.getTime()));
  }

  const availableDates = getAvailableDates(
    new Date(),
    categoryDeadline,
    weeklySettings
  );

  if (availableDates.length === 0) {
    console.warn(`No available dates for category ${category.name}`);
    return blocks;
  }

  const dailyCapacities = calculateDailyCapacities(
    availableDates,
    weeklySettings,
    totalUnits
  );

  let dateIndex = 0;

  for (let unitIndex = 0; unitIndex < totalUnits; unitIndex++) {
    while (dateIndex < availableDates.length - 1 && 
           blocks.filter(b => b.date === availableDates[dateIndex].toISOString().split('T')[0]).length >= dailyCapacities[dateIndex]) {
      dateIndex++;
    }

    if (dateIndex >= availableDates.length) {
      console.warn(`Not enough available dates to schedule all blocks for category ${category.name}`);
      break;
    }

    const block: TaskBlock = {
      id: generateId(),
      categoryId: category.id,
      projectId: project.id,
      date: availableDates[dateIndex].toISOString().split('T')[0],
      amount: category.minUnit,
      completed: false,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    blocks.push(block);
  }

  return blocks;
}