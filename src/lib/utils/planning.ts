import { type WeeklySettings, type WeeklyDistribution } from '~/types';
import { getDistributionMultiplier } from './weeklySettings';

export function getDayKeyFromDayOfWeek(dayOfWeek: number): keyof Omit<WeeklySettings, 'projectId' | 'id'> | null {
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

export function getAvailableDates(
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
    const dayKey = getDayKeyFromDayOfWeek(dayOfWeek);
    
    if (dayKey && weeklySettings[dayKey] !== 'none') {
      dates.push(new Date(current));
    }
    
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function calculateDailyCapacities(
  dates: Date[],
  weeklySettings: WeeklySettings,
  totalUnits: number
): number[] {
  if (dates.length === 0) return [];
  
  const dailyMultipliers = dates.map(date => {
    const dayOfWeek = date.getDay();
    const dayKey = getDayKeyFromDayOfWeek(dayOfWeek);
    return dayKey ? getDistributionMultiplier(weeklySettings[dayKey] as WeeklyDistribution) : 1;
  });

  const totalWeightedDays = dailyMultipliers.reduce((sum, multiplier) => sum + multiplier, 0);
  
  if (totalWeightedDays === 0) {
    return dates.map(() => 0);
  }

  // 動的配分アルゴリズム：既配置量を考慮して理想配分に近づける
  const capacities = new Array(dates.length).fill(0);
  const targetRatios = dailyMultipliers.map(multiplier => multiplier / totalWeightedDays);
  
  for (let unit = 0; unit < totalUnits; unit++) {
    let bestIndex = 0;
    let maxDeficit = -Infinity;
    
    for (let i = 0; i < dates.length; i++) {
      if (dailyMultipliers[i] === 0) continue; // 'none'設定の日はスキップ
      
      const currentRatio = capacities[i] / (unit + 1);
      const targetRatio = targetRatios[i];
      const deficit = targetRatio - currentRatio;
      
      if (deficit > maxDeficit) {
        maxDeficit = deficit;
        bestIndex = i;
      }
    }
    
    capacities[bestIndex]++;
  }

  return capacities;
}

export function getEstimatedCompletionDate(
  totalUnits: number,
  weeklyCapacity: number,
  startDate: Date = new Date()
): Date | null {
  if (totalUnits <= 0) {
    return new Date(startDate);
  }

  if (weeklyCapacity <= 0) {
    return null;
  }

  const weeksNeeded = Math.ceil(totalUnits / weeklyCapacity);
  const estimatedDate = new Date(startDate);
  estimatedDate.setDate(estimatedDate.getDate() + (weeksNeeded * 7));

  return estimatedDate;
}