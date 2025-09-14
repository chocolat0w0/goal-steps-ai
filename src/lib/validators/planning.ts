import { type Project, type Category, type WeeklySettings } from '~/types';
import { getWorkingDaysCount } from '~/lib/utils/weeklySettings';
import { getAvailableDates } from '~/lib/utils/planning';

export function validatePlanningData(
  project: Project,
  categories: Category[],
  weeklySettings: WeeklySettings
): string[] {
  const errors: string[] = [];

  if (categories.length === 0) {
    errors.push('カテゴリーが設定されていません');
  }

  const projectDeadline = new Date(project.deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (projectDeadline < today) {
    errors.push('プロジェクトの期限が過去の日付です');
  }

  const workingDaysCount = getWorkingDaysCount(weeklySettings);
  if (workingDaysCount === 0) {
    errors.push('作業日が設定されていません');
  }

  const availableDates = getAvailableDates(
    today,
    projectDeadline,
    weeklySettings
  );
  if (availableDates.length === 0) {
    errors.push('期限までに作業可能な日がありません');
  }

  for (const category of categories) {
    if (category.deadline) {
      const categoryDeadline = new Date(category.deadline);
      if (categoryDeadline < today) {
        errors.push(`カテゴリー「${category.name}」の期限が過去の日付です`);
      }
      if (categoryDeadline > projectDeadline) {
        errors.push(
          `カテゴリー「${category.name}」の期限がプロジェクト期限を超えています`
        );
      }
    }
  }

  return errors;
}
