import { type WeeklySettings } from '~/types';
import { getAllDayKeys } from '~/lib/utils/weeklySettings';

export function validateWeeklySettings(
  settings: Partial<WeeklySettings>
): string | null {
  const dayKeys = getAllDayKeys();
  const workingDaysCount = dayKeys.filter(
    (day) => settings[day] && settings[day] !== 'none'
  ).length;

  if (workingDaysCount === 0) {
    return '少なくとも1日は作業日を設定してください';
  }

  return null;
}
