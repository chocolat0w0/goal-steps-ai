import { type WeeklySettings } from '~/types';
import { validateWeeklySettings as validateSettings } from './validators/weeklySettings';
import {
  getDefaultWeeklySettings,
  getWeeklySettings as getWeeklySettingsQuery,
  saveWeeklySettings as saveWeeklySettingsQuery,
  updateWeeklySettings as updateWeeklySettingsQuery
} from './queries/weeklySettings';
import {
  getDistributionMultiplier,
  getDistributionLabel,
  getDayOfWeekName,
  getAllDayKeys,
  getWorkingDaysCount,
  getTotalWeeklyCapacity,
  getDailyCapacity
} from './utils/weeklySettings';
import { createStorageAdapter } from './queries/storage';

const storage = createStorageAdapter();

export function getWeeklySettings(projectId: string): WeeklySettings {
  return getWeeklySettingsQuery(storage, projectId);
}

export function saveWeeklySettings(settings: WeeklySettings): WeeklySettings {
  return saveWeeklySettingsQuery(storage, settings);
}

export function updateWeeklySettings(
  projectId: string,
  updates: Partial<Omit<WeeklySettings, 'projectId'>>
): WeeklySettings {
  return updateWeeklySettingsQuery(storage, projectId, updates);
}

export {
  getDefaultWeeklySettings,
  getDistributionMultiplier,
  getDistributionLabel,
  getDayOfWeekName,
  getAllDayKeys,
  getWorkingDaysCount,
  getTotalWeeklyCapacity,
  getDailyCapacity,
  validateSettings as validateWeeklySettings
};