import { type WeeklySettings } from '~/types';
import { type StorageAdapter } from './types';

export function getDefaultWeeklySettings(projectId: string): WeeklySettings {
  return {
    projectId,
    monday: 'normal',
    tuesday: 'normal',
    wednesday: 'normal',
    thursday: 'normal',
    friday: 'normal',
    saturday: 'low',
    sunday: 'low',
  };
}

export function getWeeklySettings(storage: StorageAdapter, projectId: string): WeeklySettings {
  const settings = storage.getWeeklySettings(projectId);
  return settings.length > 0 ? settings[0] : getDefaultWeeklySettings(projectId);
}

export function saveWeeklySettings(storage: StorageAdapter, settings: WeeklySettings): WeeklySettings {
  const allSettings = storage.getWeeklySettings();
  const existingIndex = allSettings.findIndex(s => s.projectId === settings.projectId);

  if (existingIndex >= 0) {
    allSettings[existingIndex] = settings;
  } else {
    allSettings.push(settings);
  }

  storage.saveWeeklySettings(allSettings);
  return settings;
}

export function updateWeeklySettings(
  storage: StorageAdapter,
  projectId: string,
  updates: Partial<Omit<WeeklySettings, 'projectId'>>
): WeeklySettings {
  const currentSettings = getWeeklySettings(storage, projectId);
  const updatedSettings = { ...currentSettings, ...updates };
  return saveWeeklySettings(storage, updatedSettings);
}