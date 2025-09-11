import { useState } from 'react';
import { type Project, type Category, type WeeklySettings, type TaskBlock } from '~/types';
import { 
  createPlan,
  validatePlanningData as validateData,
  estimateCompletionDate,
  type PlanningOptions 
} from '~/lib/planning';

export function usePlanning() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedPlan, setLastGeneratedPlan] = useState<TaskBlock[]>([]);

  const generatePlan = async (
    project: Project,
    categories: Category[],
    weeklySettings: WeeklySettings,
    options?: PlanningOptions
  ): Promise<{ success: boolean; errors: string[]; blocks: TaskBlock[] }> => {
    setIsGenerating(true);

    try {
      const validationErrors = validateData(
        project,
        categories,
        weeklySettings
      );

      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors,
          blocks: [],
        };
      }

      const blocks = createPlan(
        project,
        categories,
        weeklySettings,
        options
      );

      setLastGeneratedPlan(blocks);

      return {
        success: true,
        errors: [],
        blocks,
      };
    } catch (error) {
      console.error('Failed to generate plan:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : '計画生成中にエラーが発生しました'],
        blocks: [],
      };
    } finally {
      setIsGenerating(false);
    }
  };

  const validatePlanningData = (
    project: Project,
    categories: Category[],
    weeklySettings: WeeklySettings
  ): string[] => {
    return validateData(project, categories, weeklySettings);
  };

  const getEstimatedCompletionDate = (
    totalUnits: number,
    weeklySettings: WeeklySettings,
    startDate?: Date
  ): Date | null => {
    return estimateCompletionDate(totalUnits, weeklySettings, startDate);
  };

  const getPlanSummary = (blocks: TaskBlock[]): {
    totalBlocks: number;
    dateRange: { start: Date; end: Date } | null;
    dailyBreakdown: { [date: string]: number };
  } => {
    if (blocks.length === 0) {
      return {
        totalBlocks: 0,
        dateRange: null,
        dailyBreakdown: {},
      };
    }

    const dates = blocks.map(block => new Date(block.date));
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));

    const dailyBreakdown = blocks.reduce((breakdown, block) => {
      const date = block.date;
      breakdown[date] = (breakdown[date] || 0) + 1;
      return breakdown;
    }, {} as { [date: string]: number });

    return {
      totalBlocks: blocks.length,
      dateRange: { start: startDate, end: endDate },
      dailyBreakdown,
    };
  };

  return {
    isGenerating,
    lastGeneratedPlan,
    generatePlan,
    validatePlanningData,
    getEstimatedCompletionDate,
    getPlanSummary,
  };
}