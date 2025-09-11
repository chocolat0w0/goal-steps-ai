import { type WeeklySettings } from '~/types';
import { getDistributionMultiplier } from './weeklySettings';

export function getDayKeyFromDayOfWeek(dayOfWeek: number): keyof Omit<WeeklySettings, 'projectId'> | null {
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
  const dailyMultipliers = dates.map(date => {
    const dayOfWeek = date.getDay();
    const dayKey = getDayKeyFromDayOfWeek(dayOfWeek);
    return dayKey ? getDistributionMultiplier(weeklySettings[dayKey]) : 1;
  });

  const totalCapacity = dailyMultipliers.reduce((sum, multiplier) => sum + multiplier, 0);
  
  if (totalCapacity === 0) {
    return dates.map(() => 0);
  }

  const capacities = dailyMultipliers.map(multiplier => 
    Math.max(1, Math.round((multiplier / totalCapacity) * totalUnits))
  );

  const currentTotal = capacities.reduce((sum, capacity) => sum + capacity, 0);
  const difference = totalUnits - currentTotal;

  if (difference !== 0) {
    const maxIndex = capacities.indexOf(Math.max(...capacities));
    capacities[maxIndex] = Math.max(1, capacities[maxIndex] + difference);
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