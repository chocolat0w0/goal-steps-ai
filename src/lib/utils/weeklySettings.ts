import { type WeeklySettings, type WeeklyDistribution } from '~/types';

export function getDistributionMultiplier(distribution: WeeklyDistribution): number {
  switch (distribution) {
    case 'high':
      return 1.5;
    case 'normal':
      return 1.0;
    case 'low':
      return 0.5;
    case 'none':
      return 0;
    default:
      return 1;
  }
}

export function getDistributionLabel(distribution: WeeklyDistribution): string {
  switch (distribution) {
    case 'high':
      return '多め';
    case 'normal':
      return '普通';
    case 'low':
      return '少なめ';
    case 'none':
      return 'なし';
    default:
      return '普通';
  }
}

export function getDayOfWeekName(dayKey: keyof Omit<WeeklySettings, 'projectId'>): string {
  const dayNames = {
    monday: '月曜日',
    tuesday: '火曜日',
    wednesday: '水曜日',
    thursday: '木曜日',
    friday: '金曜日',
    saturday: '土曜日',
    sunday: '日曜日',
  };
  return dayNames[dayKey];
}

export function getAllDayKeys(): (keyof Omit<WeeklySettings, 'projectId'>)[] {
  return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
}

export function getWorkingDaysCount(settings: WeeklySettings): number {
  return getAllDayKeys().filter(day => settings[day] !== 'none').length;
}

export function getTotalWeeklyCapacity(settings: WeeklySettings, baseCapacity: number = 1): number {
  return getAllDayKeys().reduce((total, day) => {
    return total + (baseCapacity * getDistributionMultiplier(settings[day]));
  }, 0);
}

export function getDailyCapacity(
  settings: WeeklySettings,
  dayKey: keyof Omit<WeeklySettings, 'projectId'>,
  baseCapacity: number = 1
): number {
  return baseCapacity * getDistributionMultiplier(settings[dayKey]);
}