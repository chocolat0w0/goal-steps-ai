import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWeeklySettings } from '../useWeeklySettings';
import * as weeklySettingsService from '~/lib/weeklySettings';
import { setupMockLocalStorage } from '~/test/mocks/localStorage';
import { mockProject, mockWeeklySettings } from '~/test/fixtures/testData';
import { type WeeklySettings, type WeeklyDistribution } from '~/types';

// WeeklySettingsServiceのモック
vi.mock('~/lib/weeklySettings', () => ({
  getWeeklySettings: vi.fn(),
  updateWeeklySettings: vi.fn(),
  validateWeeklySettings: vi.fn(),
  getDefaultWeeklySettings: vi.fn(),
  getDistributionLabel: vi.fn(),
  getDayOfWeekName: vi.fn(),
  getWorkingDaysCount: vi.fn(),
  getTotalWeeklyCapacity: vi.fn(),
  getDailyCapacity: vi.fn(),
}));

describe('useWeeklySettings', () => {
  beforeEach(() => {
    setupMockLocalStorage();
    vi.clearAllMocks();
  });

  describe('初期化', () => {
    it('フックの初期状態が正しいこと', async () => {
      const defaultSettings = { ...mockWeeklySettings, id: `weekly-${mockProject.id}` };
      vi.mocked(weeklySettingsService.getWeeklySettings).mockReturnValue(defaultSettings);

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      // 初期化後は設定がロードされている
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.settings).toEqual(defaultSettings);
      expect(typeof result.current.updateSettings).toBe('function');
      expect(typeof result.current.updateDayDistribution).toBe('function');
      expect(typeof result.current.resetToDefault).toBe('function');
      expect(typeof result.current.refreshSettings).toBe('function');
      expect(typeof result.current.getDistributionLabel).toBe('function');
      expect(typeof result.current.getDayName).toBe('function');
      expect(typeof result.current.getWorkingDaysCount).toBe('function');
      expect(typeof result.current.getTotalWeeklyCapacity).toBe('function');
      expect(typeof result.current.getDailyCapacity).toBe('function');
    });

    it('初期化時にプロジェクトの週間設定を読み込むこと', async () => {
      vi.mocked(weeklySettingsService.getWeeklySettings).mockReturnValue(mockWeeklySettings);

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(weeklySettingsService.getWeeklySettings).toHaveBeenCalledWith(mockProject.id);
      expect(result.current.settings).toEqual(mockWeeklySettings);
    });

    it('projectIdが変更された時に再読み込みすること', async () => {
      const newProjectId = 'new-project-id';
      const defaultSettings = { ...mockWeeklySettings, id: `weekly-${mockProject.id}` };
      vi.mocked(weeklySettingsService.getWeeklySettings).mockReturnValue(defaultSettings);

      const { result, rerender } = renderHook(
        ({ projectId }) => useWeeklySettings(projectId),
        { initialProps: { projectId: mockProject.id } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(weeklySettingsService.getWeeklySettings).toHaveBeenCalledWith(mockProject.id);

      // projectIdを変更
      rerender({ projectId: newProjectId });

      await waitFor(() => {
        expect(weeklySettingsService.getWeeklySettings).toHaveBeenCalledWith(newProjectId);
      });
    });

    it('設定読み込みエラー時にローディングがfalseになること', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(weeklySettingsService.getWeeklySettings).mockImplementation(() => {
        throw new Error('Loading failed');
      });

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.settings).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load weekly settings:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('updateSettings', () => {
    beforeEach(() => {
      vi.mocked(weeklySettingsService.getWeeklySettings).mockReturnValue(mockWeeklySettings);
      vi.mocked(weeklySettingsService.validateWeeklySettings).mockReturnValue(null);
    });

    it('週間設定を更新できること', async () => {
      const updatedSettings = { ...mockWeeklySettings, monday: 'high' as const };
      vi.mocked(weeklySettingsService.updateWeeklySettings).mockReturnValue(updatedSettings);

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: WeeklySettings | null = null;
      await act(async () => {
        updateResult = await result.current.updateSettings({ monday: 'high' });
      });

      expect(updateResult).toEqual(updatedSettings);
      expect(result.current.settings).toEqual(updatedSettings);
      expect(weeklySettingsService.updateWeeklySettings).toHaveBeenCalledWith(mockProject.id, { monday: 'high' });
    });

    it('バリデーションエラー時にnullを返すこと', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(weeklySettingsService.validateWeeklySettings).mockReturnValue('設定が無効です');

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: WeeklySettings | null = null;
      await act(async () => {
        updateResult = await result.current.updateSettings({ monday: 'invalid' as WeeklyDistribution });
      });

      expect(updateResult).toBeNull();
      expect(weeklySettingsService.updateWeeklySettings).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('設定更新エラー時にnullを返すこと', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(weeklySettingsService.updateWeeklySettings).mockImplementation(() => {
        throw new Error('Update failed');
      });

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: WeeklySettings | null = null;
      await act(async () => {
        updateResult = await result.current.updateSettings({ monday: 'high' });
      });

      expect(updateResult).toBeNull();
      
      consoleSpy.mockRestore();
    });
  });

  describe('updateDayDistribution', () => {
    beforeEach(() => {
      vi.mocked(weeklySettingsService.getWeeklySettings).mockReturnValue(mockWeeklySettings);
      vi.mocked(weeklySettingsService.validateWeeklySettings).mockReturnValue(null);
    });

    it('特定の曜日の配分を更新できること', async () => {
      const updatedSettings = { ...mockWeeklySettings, tuesday: 'low' as const };
      vi.mocked(weeklySettingsService.updateWeeklySettings).mockReturnValue(updatedSettings);

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: WeeklySettings | null = null;
      await act(async () => {
        updateResult = await result.current.updateDayDistribution('tuesday', 'low');
      });

      expect(updateResult).toEqual(updatedSettings);
      expect(result.current.settings).toEqual(updatedSettings);
      expect(weeklySettingsService.updateWeeklySettings).toHaveBeenCalledWith(mockProject.id, { tuesday: 'low' });
    });
  });

  describe('resetToDefault', () => {
    beforeEach(() => {
      vi.mocked(weeklySettingsService.getWeeklySettings).mockReturnValue(mockWeeklySettings);
      vi.mocked(weeklySettingsService.validateWeeklySettings).mockReturnValue(null);
    });

    it('デフォルト設定にリセットできること', async () => {
      const defaultSettings: WeeklySettings = {
        id: `weekly-${mockProject.id}`,
        projectId: mockProject.id,
        monday: 'normal',
        tuesday: 'normal',
        wednesday: 'normal',
        thursday: 'normal',
        friday: 'normal',
        saturday: 'normal',
        sunday: 'none',
      };
      vi.mocked(weeklySettingsService.getDefaultWeeklySettings).mockReturnValue(defaultSettings);
      vi.mocked(weeklySettingsService.updateWeeklySettings).mockReturnValue(defaultSettings);

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let resetResult: WeeklySettings | null = null;
      await act(async () => {
        resetResult = await result.current.resetToDefault();
      });

      expect(resetResult).toEqual(defaultSettings);
      expect(result.current.settings).toEqual(defaultSettings);
      expect(weeklySettingsService.getDefaultWeeklySettings).toHaveBeenCalledWith(mockProject.id);
    });
  });

  describe('ユーティリティ関数', () => {
    beforeEach(() => {
      vi.mocked(weeklySettingsService.getWeeklySettings).mockReturnValue(mockWeeklySettings);
    });

    it('getDistributionLabelが正しく動作すること', async () => {
      vi.mocked(weeklySettingsService.getDistributionLabel).mockReturnValue('普通');

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const label = result.current.getDistributionLabel('normal');

      expect(label).toBe('普通');
      expect(weeklySettingsService.getDistributionLabel).toHaveBeenCalledWith('normal');
    });

    it('getDayNameが正しく動作すること', async () => {
      vi.mocked(weeklySettingsService.getDayOfWeekName).mockReturnValue('月曜日');

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const dayName = result.current.getDayName('monday');

      expect(dayName).toBe('月曜日');
      expect(weeklySettingsService.getDayOfWeekName).toHaveBeenCalledWith('monday');
    });

    it('getWorkingDaysCountが正しく動作すること', async () => {
      vi.mocked(weeklySettingsService.getWorkingDaysCount).mockReturnValue(5);

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const workingDays = result.current.getWorkingDaysCount();

      expect(workingDays).toBe(5);
      expect(weeklySettingsService.getWorkingDaysCount).toHaveBeenCalledWith(mockWeeklySettings);
    });

    it('設定がnullの場合のgetWorkingDaysCountが0を返すこと', async () => {
      vi.mocked(weeklySettingsService.getWeeklySettings).mockImplementation(() => {
        throw new Error('No settings found');
      });

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const workingDays = result.current.getWorkingDaysCount();

      expect(workingDays).toBe(0);
    });

    it('getTotalWeeklyCapacityが正しく動作すること', async () => {
      vi.mocked(weeklySettingsService.getTotalWeeklyCapacity).mockReturnValue(7.5);

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const totalCapacity = result.current.getTotalWeeklyCapacity(1.5);

      expect(totalCapacity).toBe(7.5);
      expect(weeklySettingsService.getTotalWeeklyCapacity).toHaveBeenCalledWith(mockWeeklySettings, 1.5);
    });

    it('設定がnullの場合のgetTotalWeeklyCapacityが0を返すこと', async () => {
      vi.mocked(weeklySettingsService.getWeeklySettings).mockImplementation(() => {
        throw new Error('No settings found');
      });

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const totalCapacity = result.current.getTotalWeeklyCapacity();

      expect(totalCapacity).toBe(0);
    });

    it('getDailyCapacityが正しく動作すること', async () => {
      vi.mocked(weeklySettingsService.getDailyCapacity).mockReturnValue(1.5);

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const dailyCapacity = result.current.getDailyCapacity('monday', 1.0);

      expect(dailyCapacity).toBe(1.5);
      expect(weeklySettingsService.getDailyCapacity).toHaveBeenCalledWith(mockWeeklySettings, 'monday', 1.0);
    });

    it('設定がnullの場合のgetDailyCapacityが0を返すこと', async () => {
      vi.mocked(weeklySettingsService.getWeeklySettings).mockImplementation(() => {
        throw new Error('No settings found');
      });

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const dailyCapacity = result.current.getDailyCapacity('monday');

      expect(dailyCapacity).toBe(0);
    });
  });

  describe('refreshSettings', () => {
    it('設定を再読み込みできること', async () => {
      const initialSettings = mockWeeklySettings;
      const updatedSettings = { ...mockWeeklySettings, monday: 'high' as const };
      
      vi.mocked(weeklySettingsService.getWeeklySettings)
        .mockReturnValueOnce(initialSettings)
        .mockReturnValueOnce(updatedSettings);

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.settings).toEqual(initialSettings);

      await act(async () => {
        result.current.refreshSettings();
      });

      expect(result.current.settings).toEqual(updatedSettings);
      expect(weeklySettingsService.getWeeklySettings).toHaveBeenCalledTimes(2);
    });
  });
});