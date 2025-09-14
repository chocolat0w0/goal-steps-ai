import { useState } from 'react';
import {
  type Project,
  type Category,
  type WeeklySettings,
  type TaskBlock,
} from '~/types';
import {
  createPlan,
  validatePlanningData as validateData,
  type PlanningOptions,
} from '~/lib/planning';

export function usePlanning() {
  const [isGenerating, setIsGenerating] = useState(false);

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

      const blocks = createPlan(project, categories, weeklySettings, options);

      return {
        success: true,
        errors: [],
        blocks,
      };
    } catch (error) {
      console.error('Failed to generate plan:', error);
      return {
        success: false,
        errors: [
          error instanceof Error
            ? error.message
            : '計画生成中にエラーが発生しました',
        ],
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

  return {
    isGenerating,
    generatePlan,
    validatePlanningData,
  };
}
