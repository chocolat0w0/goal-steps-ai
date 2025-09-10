import { type Project, type Category, type WeeklySettings, type TaskBlock } from '~/types';
import { WeeklySettingsService } from './weeklySettingsService';
import { CategoryService } from './categoryService';
import { Storage } from './storage';

export interface PlanningOptions {
  respectCategoryDeadlines: boolean;
  prioritizeWeeklyDistribution: boolean;
}

export class PlanningService {
  static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  static generatePlan(
    project: Project,
    categories: Category[],
    weeklySettings: WeeklySettings,
    options: PlanningOptions = {
      respectCategoryDeadlines: true,
      prioritizeWeeklyDistribution: true,
    }
  ): TaskBlock[] {
    // 既存のタスクブロックを削除
    Storage.saveTaskBlocks(Storage.getTaskBlocks().filter(t => t.projectId !== project.id));

    const taskBlocks: TaskBlock[] = [];
    const projectDeadline = new Date(project.deadline);
    
    // 各カテゴリーをタスクブロックに分割
    for (const category of categories) {
      const categoryBlocks = this.createTaskBlocksForCategory(
        category,
        project,
        weeklySettings,
        projectDeadline,
        options
      );
      taskBlocks.push(...categoryBlocks);
    }

    // 日付順にソート
    taskBlocks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // ストレージに保存
    Storage.saveTaskBlocks(taskBlocks);

    return taskBlocks;
  }

  static createTaskBlocksForCategory(
    category: Category,
    project: Project,
    weeklySettings: WeeklySettings,
    projectDeadline: Date,
    options: PlanningOptions
  ): TaskBlock[] {
    const blocks: TaskBlock[] = [];
    const totalUnits = CategoryService.getTotalUnits(category);
    
    // カテゴリーの期限を決定
    const categoryDeadline = category.deadline 
      ? new Date(category.deadline)
      : projectDeadline;
    
    if (options.respectCategoryDeadlines && category.deadline) {
      // カテゴリー期限が優先
      categoryDeadline.setTime(Math.min(categoryDeadline.getTime(), projectDeadline.getTime()));
    }

    // 利用可能な日付を取得
    const availableDates = this.getAvailableDates(
      new Date(),
      categoryDeadline,
      weeklySettings
    );

    if (availableDates.length === 0) {
      console.warn(`No available dates for category ${category.name}`);
      return blocks;
    }

    // 各日の容量を計算
    const dailyCapacities = this.calculateDailyCapacities(
      availableDates,
      weeklySettings,
      totalUnits
    );

    // タスクブロックを生成
    let dateIndex = 0;

    for (let unitIndex = 0; unitIndex < totalUnits; unitIndex++) {
      // 現在の日付の容量を超えた場合、次の日に移動
      while (dateIndex < availableDates.length - 1 && 
             blocks.filter(b => b.date === availableDates[dateIndex].toISOString().split('T')[0]).length >= dailyCapacities[dateIndex]) {
        dateIndex++;
      }

      if (dateIndex >= availableDates.length) {
        console.warn(`Not enough available dates to schedule all blocks for category ${category.name}`);
        break;
      }

      const block: TaskBlock = {
        id: this.generateId(),
        categoryId: category.id,
        projectId: project.id,
        date: availableDates[dateIndex].toISOString().split('T')[0],
        amount: category.minUnit,
        completed: false,
        createdAt: this.getCurrentTimestamp(),
        updatedAt: this.getCurrentTimestamp(),
      };

      blocks.push(block);
    }

    return blocks;
  }

  static getAvailableDates(
    startDate: Date,
    endDate: Date,
    weeklySettings: WeeklySettings
  ): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
      const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, ...
      const dayKey = this.getDayKeyFromDayOfWeek(dayOfWeek);
      
      if (dayKey && weeklySettings[dayKey] !== 'none') {
        dates.push(new Date(current));
      }
      
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  static getDayKeyFromDayOfWeek(dayOfWeek: number): keyof Omit<WeeklySettings, 'projectId'> | null {
    const dayMap = {
      0: 'sunday',    // Sunday
      1: 'monday',    // Monday
      2: 'tuesday',   // Tuesday
      3: 'wednesday', // Wednesday
      4: 'thursday',  // Thursday
      5: 'friday',    // Friday
      6: 'saturday',  // Saturday
    } as const;

    return dayMap[dayOfWeek as keyof typeof dayMap] || null;
  }

  static calculateDailyCapacities(
    dates: Date[],
    weeklySettings: WeeklySettings,
    totalUnits: number
  ): number[] {
    // 各日の基本容量を計算
    const dailyMultipliers = dates.map(date => {
      const dayOfWeek = date.getDay();
      const dayKey = this.getDayKeyFromDayOfWeek(dayOfWeek);
      return dayKey ? WeeklySettingsService.getDistributionMultiplier(weeklySettings[dayKey]) : 1;
    });

    // 総容量を計算
    const totalCapacity = dailyMultipliers.reduce((sum, multiplier) => sum + multiplier, 0);
    
    if (totalCapacity === 0) {
      return dates.map(() => 0);
    }

    // 各日の容量を算出（比例配分）
    const capacities = dailyMultipliers.map(multiplier => 
      Math.max(1, Math.round((multiplier / totalCapacity) * totalUnits))
    );

    // 端数調整（合計がtotalUnitsになるように）
    const currentTotal = capacities.reduce((sum, capacity) => sum + capacity, 0);
    const difference = totalUnits - currentTotal;

    if (difference !== 0) {
      // 最も大きい容量の日に差分を追加/減算
      const maxIndex = capacities.indexOf(Math.max(...capacities));
      capacities[maxIndex] = Math.max(1, capacities[maxIndex] + difference);
    }

    return capacities;
  }

  static validatePlanningData(
    project: Project,
    categories: Category[],
    weeklySettings: WeeklySettings
  ): string[] {
    const errors: string[] = [];

    if (categories.length === 0) {
      errors.push('カテゴリーが設定されていません');
    }

    // プロジェクト期限の確認
    const projectDeadline = new Date(project.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (projectDeadline < today) {
      errors.push('プロジェクトの期限が過去の日付です');
    }

    // 作業可能日の確認
    const workingDaysCount = WeeklySettingsService.getWorkingDaysCount(weeklySettings);
    if (workingDaysCount === 0) {
      errors.push('作業日が設定されていません');
    }

    // 利用可能な日数の確認
    const availableDates = this.getAvailableDates(today, projectDeadline, weeklySettings);
    if (availableDates.length === 0) {
      errors.push('期限までに作業可能な日がありません');
    }

    // カテゴリー期限の確認
    for (const category of categories) {
      if (category.deadline) {
        const categoryDeadline = new Date(category.deadline);
        if (categoryDeadline < today) {
          errors.push(`カテゴリー「${category.name}」の期限が過去の日付です`);
        }
        if (categoryDeadline > projectDeadline) {
          errors.push(`カテゴリー「${category.name}」の期限がプロジェクト期限を超えています`);
        }
      }
    }

    return errors;
  }

  static getEstimatedCompletionDate(
    totalUnits: number,
    weeklySettings: WeeklySettings,
    startDate: Date = new Date()
  ): Date | null {
    if (totalUnits <= 0) {
      return new Date(startDate);
    }

    const weeklyCapacity = WeeklySettingsService.getTotalWeeklyCapacity(weeklySettings);
    if (weeklyCapacity <= 0) {
      return null;
    }

    const weeksNeeded = Math.ceil(totalUnits / weeklyCapacity);
    const estimatedDate = new Date(startDate);
    estimatedDate.setDate(estimatedDate.getDate() + (weeksNeeded * 7));

    return estimatedDate;
  }
}