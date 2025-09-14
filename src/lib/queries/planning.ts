import { type Project, type Category, type WeeklySettings, type TaskBlock } from '~/types';
import { type StorageAdapter } from './types';
import { generateId, getCurrentTimestamp } from '~/lib/utils/common';
import { getTotalUnits } from '~/lib/utils/category';
import { getAvailableDates, calculateDailyCapacities } from '~/lib/utils/planning';

export interface PlanningOptions {
  respectCategoryDeadlines: boolean;
  prioritizeWeeklyDistribution: boolean;
  maxCategoriesPerDay?: number;
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
  // 完了済みタスクを保持し、未完了タスクのみを削除
  const existingTaskBlocks = storage.getTaskBlocks();
  const completedTaskBlocks = existingTaskBlocks.filter(t => 
    t.projectId === project.id && t.completed
  );
  const nonProjectTaskBlocks = existingTaskBlocks.filter(t => 
    t.projectId !== project.id
  );

  // 完了済み作業量を計算して、各カテゴリーの残り作業量を考慮
  const completedAmountsByCategory = calculateCompletedAmountsByCategory(
    completedTaskBlocks, 
    categories
  );

  const taskBlocks = createOptimizedTaskBlocks(
    categories,
    project,
    weeklySettings,
    options,
    completedAmountsByCategory
  );

  taskBlocks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 完了済みタスクと新しい計画を結合
  const allTaskBlocks = [...nonProjectTaskBlocks, ...completedTaskBlocks, ...taskBlocks];
  storage.saveTaskBlocks(allTaskBlocks);

  return [...completedTaskBlocks, ...taskBlocks];
}

function calculateCompletedAmountsByCategory(
  completedTaskBlocks: TaskBlock[],
  categories: Category[]
): Map<string, number> {
  const completedAmounts = new Map<string, number>();
  
  // 各カテゴリーの完了済み作業量を初期化
  categories.forEach(category => {
    completedAmounts.set(category.id, 0);
  });
  
  // 完了済みタスクブロックから作業量を集計
  completedTaskBlocks.forEach(taskBlock => {
    const currentAmount = completedAmounts.get(taskBlock.categoryId) || 0;
    completedAmounts.set(taskBlock.categoryId, currentAmount + taskBlock.amount);
  });
  
  return completedAmounts;
}

export function createOptimizedTaskBlocks(
  categories: Category[],
  project: Project,
  weeklySettings: WeeklySettings,
  options: PlanningOptions,
  completedAmountsByCategory?: Map<string, number>
): TaskBlock[] {
  if (categories.length === 0) return [];

  const projectDeadline = new Date(project.deadline);
  const availableDates = getAvailableDates(new Date(), projectDeadline, weeklySettings);
  
  if (availableDates.length === 0) {
    console.warn('No available dates for project');
    return [];
  }

  // 完了済み作業量を考慮した残り作業量を計算
  const remainingUnits = categories.map(category => {
    const totalUnits = getTotalUnits(category);
    const completedAmount = completedAmountsByCategory?.get(category.id) || 0;
    return Math.max(0, totalUnits - completedAmount);
  });

  const totalRemainingUnits = remainingUnits.reduce((sum, units) => sum + units, 0);
  
  // 残り作業がない場合は空配列を返す
  if (totalRemainingUnits === 0) {
    return [];
  }

  const dailyCapacities = calculateDailyCapacities(availableDates, weeklySettings, totalRemainingUnits);

  const categoryWeights = remainingUnits.map(units => units / totalRemainingUnits);
  
  const dailyAllocations = calculateDailyAllocations(
    dailyCapacities,
    categoryWeights,
    categories,
    options.maxCategoriesPerDay
  );

  return generateTaskBlocks(categories, availableDates, dailyAllocations, project, remainingUnits);
}

function calculateDailyAllocations(
  dailyCapacities: number[],
  categoryWeights: number[],
  categories: Category[],
  maxCategoriesPerDay?: number
): number[][] {
  return dailyCapacities.map(capacity => {
    let allocations = categoryWeights.map(weight => 
      Math.floor(capacity * weight)
    );

    let remaining = capacity - allocations.reduce((sum, a) => sum + a, 0);
    
    if (maxCategoriesPerDay && categories.length > maxCategoriesPerDay) {
      allocations = constrainCategoriesPerDay(allocations, categoryWeights, maxCategoriesPerDay, capacity);
      remaining = capacity - allocations.reduce((sum, a) => sum + a, 0);
    }

    for (let i = 0; i < remaining; i++) {
      const sortedIndices = categoryWeights
        .map((weight, index) => ({ weight, index }))
        .sort((a, b) => b.weight - a.weight);
      
      for (const { index } of sortedIndices) {
        if (allocations[index] > 0 || !maxCategoriesPerDay || allocations.filter(a => a > 0).length < maxCategoriesPerDay) {
          allocations[index]++;
          break;
        }
      }
    }

    return allocations;
  });
}

function constrainCategoriesPerDay(
  _allocations: number[],
  categoryWeights: number[],
  maxCategories: number,
  totalCapacity: number
): number[] {
  const topCategories = categoryWeights
    .map((weight, index) => ({ weight, index }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, maxCategories);

  const newAllocations = new Array(categoryWeights.length).fill(0);
  const totalSelectedWeight = topCategories.reduce((sum, cat) => sum + cat.weight, 0);

  topCategories.forEach(({ index, weight }) => {
    newAllocations[index] = Math.floor((weight / totalSelectedWeight) * totalCapacity);
  });

  return newAllocations;
}

function generateTaskBlocks(
  categories: Category[],
  availableDates: Date[],
  dailyAllocations: number[][],
  project: Project,
  remainingUnits: number[]
): TaskBlock[] {
  const result: TaskBlock[] = [];
  const categoryCounters = categories.map(() => 0);

  // 最初に計画通りに配分
  dailyAllocations.forEach((allocations, dateIndex) => {
    if (dateIndex >= availableDates.length) return;

    allocations.forEach((count, categoryIndex) => {
      const category = categories[categoryIndex];
      const remainingUnitsForCategory = remainingUnits[categoryIndex];
      
      for (let i = 0; i < count; i++) {
        if (categoryCounters[categoryIndex] < remainingUnitsForCategory) {
          result.push({
            id: generateId(),
            categoryId: category.id,
            projectId: project.id,
            date: availableDates[dateIndex].toISOString().split('T')[0],
            amount: category.minUnit,
            completed: false,
            createdAt: getCurrentTimestamp(),
            updatedAt: getCurrentTimestamp(),
          });
          categoryCounters[categoryIndex]++;
        }
      }
    });
  });

  // 未配置のタスクを残り日数に配分
  let dateIndex = 0;
  categories.forEach((category, categoryIndex) => {
    const remainingUnitsForCategory = remainingUnits[categoryIndex];
    const remaining = remainingUnitsForCategory - categoryCounters[categoryIndex];
    
    for (let i = 0; i < remaining; i++) {
      if (dateIndex >= availableDates.length) {
        // 期日を過ぎる場合は最終日に配置
        dateIndex = availableDates.length - 1;
      }
      
      result.push({
        id: generateId(),
        categoryId: category.id,
        projectId: project.id,
        date: availableDates[dateIndex].toISOString().split('T')[0],
        amount: category.minUnit,
        completed: false,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
      });
      
      // 次の利用可能な日に移動
      dateIndex = (dateIndex + 1) % availableDates.length;
    }
  });

  return result;
}

// Legacy function kept for backward compatibility (not used in optimized algorithm)
export function createTaskBlocksForCategory(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _storage: StorageAdapter,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _category: Category,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _project: Project,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _weeklySettings: WeeklySettings,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _projectDeadline: Date,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: PlanningOptions
): TaskBlock[] {
  console.warn('createTaskBlocksForCategory is deprecated. Use createOptimizedTaskBlocks instead.');
  return [];
}