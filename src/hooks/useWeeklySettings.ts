import { useState, useEffect, useCallback } from 'react';
import { type WeeklySettings, type WeeklyDistribution } from '~/types';
import {
  getWeeklySettings,
  updateWeeklySettings,
  getDefaultWeeklySettings,
  getDistributionLabel,
  getDayOfWeekName,
  getWorkingDaysCount,
  getTotalWeeklyCapacity,
  getDailyCapacity,
  validateWeeklySettings,
} from '~/lib/weeklySettings';

export function useWeeklySettings(projectId: string) {
  const [settings, setSettings] = useState<WeeklySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(() => {
    try {
      const loadedSettings = getWeeklySettings(projectId);
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load weekly settings:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = (
    updates: Partial<Omit<WeeklySettings, 'projectId'>>
  ): Promise<WeeklySettings | null> => {
    return new Promise((resolve) => {
      try {
        const newSettings = { ...settings!, ...updates };
        const validationError = validateWeeklySettings(newSettings);

        if (validationError) {
          throw new Error(validationError);
        }

        const updatedSettings = updateWeeklySettings(projectId, updates);
        setSettings(updatedSettings);
        resolve(updatedSettings);
      } catch (error) {
        console.error('Failed to update weekly settings:', error);
        resolve(null);
      }
    });
  };

  const updateDayDistribution = (
    day: keyof Omit<WeeklySettings, 'projectId'>,
    distribution: WeeklyDistribution
  ): Promise<WeeklySettings | null> => {
    return updateSettings({ [day]: distribution });
  };

  const resetToDefault = (): Promise<WeeklySettings | null> => {
    const defaultSettings = getDefaultWeeklySettings(projectId);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { projectId: _, ...updates } = defaultSettings;
    return updateSettings(updates);
  };

  const getLabel = (distribution: WeeklyDistribution): string => {
    return getDistributionLabel(distribution);
  };

  const getDayName = (
    dayKey: keyof Omit<WeeklySettings, 'projectId' | 'id'>
  ): string => {
    return getDayOfWeekName(dayKey);
  };

  const getWorkingDays = (): number => {
    return settings ? getWorkingDaysCount(settings) : 0;
  };

  const getWeeklyCapacity = (baseCapacity: number = 1): number => {
    return settings ? getTotalWeeklyCapacity(settings, baseCapacity) : 0;
  };

  const getCapacityForDay = (
    dayKey: keyof Omit<WeeklySettings, 'projectId' | 'id'>,
    baseCapacity: number = 1
  ): number => {
    return settings ? getDailyCapacity(settings, dayKey, baseCapacity) : 0;
  };

  return {
    settings,
    loading,
    updateSettings,
    updateDayDistribution,
    resetToDefault,
    refreshSettings: loadSettings,
    getDistributionLabel: getLabel,
    getDayName,
    getWorkingDaysCount: getWorkingDays,
    getTotalWeeklyCapacity: getWeeklyCapacity,
    getDailyCapacity: getCapacityForDay,
  };
}
