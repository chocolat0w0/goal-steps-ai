import { useState, useEffect, useCallback } from 'react';
import { type WeeklySettings, type WeeklyDistribution } from '~/types';
import { WeeklySettingsService } from '~/lib/weeklySettingsService';

export function useWeeklySettings(projectId: string) {
  const [settings, setSettings] = useState<WeeklySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(() => {
    try {
      const loadedSettings = WeeklySettingsService.getWeeklySettings(projectId);
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
        const validationError = WeeklySettingsService.validateWeeklySettings(newSettings);
        
        if (validationError) {
          throw new Error(validationError);
        }

        const updatedSettings = WeeklySettingsService.updateWeeklySettings(projectId, updates);
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
    const defaultSettings = WeeklySettingsService.getDefaultWeeklySettings(projectId);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { projectId: _, ...updates } = defaultSettings;
    return updateSettings(updates);
  };

  const getDistributionLabel = (distribution: WeeklyDistribution): string => {
    return WeeklySettingsService.getDistributionLabel(distribution);
  };

  const getDayName = (dayKey: keyof Omit<WeeklySettings, 'projectId'>): string => {
    return WeeklySettingsService.getDayOfWeekName(dayKey);
  };

  const getWorkingDaysCount = (): number => {
    return settings ? WeeklySettingsService.getWorkingDaysCount(settings) : 0;
  };

  const getTotalWeeklyCapacity = (baseCapacity: number = 1): number => {
    return settings ? WeeklySettingsService.getTotalWeeklyCapacity(settings, baseCapacity) : 0;
  };

  const getDailyCapacity = (
    dayKey: keyof Omit<WeeklySettings, 'projectId'>,
    baseCapacity: number = 1
  ): number => {
    return settings ? WeeklySettingsService.getDailyCapacity(settings, dayKey, baseCapacity) : 0;
  };

  return {
    settings,
    loading,
    updateSettings,
    updateDayDistribution,
    resetToDefault,
    refreshSettings: loadSettings,
    getDistributionLabel,
    getDayName,
    getWorkingDaysCount,
    getTotalWeeklyCapacity,
    getDailyCapacity,
  };
}