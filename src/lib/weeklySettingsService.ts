import { type WeeklySettings, type WeeklyDistribution } from '~/types';
import { Storage } from './storage';

export class WeeklySettingsService {
  static getDefaultWeeklySettings(projectId: string): WeeklySettings {
    return {
      projectId,
      monday: 'high',
      tuesday: 'high',
      wednesday: 'high',
      thursday: 'high',
      friday: 'high',
      saturday: 'low',
      sunday: 'low',
    };
  }

  static getWeeklySettings(projectId: string): WeeklySettings {
    const settings = Storage.getWeeklySettings(projectId);
    return settings.length > 0 ? settings[0] : this.getDefaultWeeklySettings(projectId);
  }

  static saveWeeklySettings(settings: WeeklySettings): WeeklySettings {
    const allSettings = Storage.getWeeklySettings();
    const existingIndex = allSettings.findIndex(s => s.projectId === settings.projectId);

    if (existingIndex >= 0) {
      allSettings[existingIndex] = settings;
    } else {
      allSettings.push(settings);
    }

    Storage.saveWeeklySettings(allSettings);
    return settings;
  }

  static updateWeeklySettings(
    projectId: string,
    updates: Partial<Omit<WeeklySettings, 'projectId'>>
  ): WeeklySettings {
    const currentSettings = this.getWeeklySettings(projectId);
    const updatedSettings = { ...currentSettings, ...updates };
    return this.saveWeeklySettings(updatedSettings);
  }

  static getDistributionMultiplier(distribution: WeeklyDistribution): number {
    switch (distribution) {
      case 'high':
        return 1.5;
      case 'low':
        return 0.5;
      case 'none':
        return 0;
      default:
        return 1;
    }
  }

  static getDistributionLabel(distribution: WeeklyDistribution): string {
    switch (distribution) {
      case 'high':
        return '多め';
      case 'low':
        return '少なめ';
      case 'none':
        return 'なし';
      default:
        return '普通';
    }
  }

  static getDayOfWeekName(dayKey: keyof Omit<WeeklySettings, 'projectId'>): string {
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

  static getAllDayKeys(): (keyof Omit<WeeklySettings, 'projectId'>)[] {
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  }

  static getWorkingDaysCount(settings: WeeklySettings): number {
    return this.getAllDayKeys().filter(day => settings[day] !== 'none').length;
  }

  static getTotalWeeklyCapacity(settings: WeeklySettings, baseCapacity: number = 1): number {
    return this.getAllDayKeys().reduce((total, day) => {
      return total + (baseCapacity * this.getDistributionMultiplier(settings[day]));
    }, 0);
  }

  static getDailyCapacity(
    settings: WeeklySettings,
    dayKey: keyof Omit<WeeklySettings, 'projectId'>,
    baseCapacity: number = 1
  ): number {
    return baseCapacity * this.getDistributionMultiplier(settings[dayKey]);
  }

  static validateWeeklySettings(settings: Partial<WeeklySettings>): string | null {
    const dayKeys = this.getAllDayKeys();
    const workingDaysCount = dayKeys.filter(
      day => settings[day] && settings[day] !== 'none'
    ).length;

    if (workingDaysCount === 0) {
      return '少なくとも1日は作業日を設定してください';
    }

    return null;
  }
}