import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWeeklySettings } from '../useWeeklySettings';
import * as weeklySettingsService from '~/lib/weeklySettings';
import { setupMockLocalStorage } from '~/test/mocks/localStorage';
import { mockProject, mockWeeklySettings } from '~/test/fixtures/testData';
import { type WeeklySettings, type WeeklyDistribution } from '~/types';

// WeeklySettingsServiceのモック
vi.mock('~/lib/weeklySettings', () => ({
  WeeklySettingsService: {
    getWeeklySettings: vi.fn(),
    updateWeeklySettings: vi.fn(),
    validateWeeklySettings: vi.fn(),
    getDefaultWeeklySettings: vi.fn(),
    getDistributionLabel: vi.fn(),
    getDayOfWeekName: vi.fn(),
    getWorkingDaysCount: vi.fn(),
    getTotalWeeklyCapacity: vi.fn(),
    getDailyCapacity: vi.fn(),
  },
}));

describe('useWeeklySettings', () => {
  beforeEach(() => {
    setupMockLocalStorage();
    vi.clearAllMocks();
  });

  describe('初期化', () => {
    it('フックの初期状態が正しいこと', async () => {
      vi.mocked(WeeklySettingsService.getWeeklySettings).mockReturnValue(null);

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      expect(result.current.settings).toBeNull();
      expect(typeof result.current.updateSettings).toBe('function');
      expect(typeof result.current.updateDayDistribution).toBe('function');
      expect(typeof result.current.resetToDefault).toBe('function');
      expect(typeof result.current.refreshSettings).toBe('function');
      expect(typeof result.current.getDistributionLabel).toBe('function');
      expect(typeof result.current.getDayName).toBe('function');
      expect(typeof result.current.getWorkingDaysCount).toBe('function');
      expect(typeof result.current.getTotalWeeklyCapacity).toBe('function');
      expect(typeof result.current.getDailyCapacity).toBe('function');

      // ローディングが完了するまで待機
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('初期化時にプロジェクトの週間設定を読み込むこと', async () => {
      vi.mocked(WeeklySettingsService.getWeeklySettings).mockReturnValue(mockWeeklySettings);

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(WeeklySettingsService.getWeeklySettings).toHaveBeenCalledWith(mockProject.id);
      expect(result.current.settings).toEqual(mockWeeklySettings);
    });

    it('projectIdが変更された時に再読み込みすること', async () => {
      const newProjectId = 'new-project-id';
      vi.mocked(WeeklySettingsService.getWeeklySettings).mockReturnValue(null);

      const { result, rerender } = renderHook(
        ({ projectId }) => useWeeklySettings(projectId),
        { initialProps: { projectId: mockProject.id } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(WeeklySettingsService.getWeeklySettings).toHaveBeenCalledWith(mockProject.id);

      // projectIdを変更
      rerender({ projectId: newProjectId });

      await waitFor(() => {
        expect(WeeklySettingsService.getWeeklySettings).toHaveBeenCalledWith(newProjectId);
      });
    });

    it('設定読み込みエラー時にローディングがfalseになること', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(WeeklySettingsService.getWeeklySettings).mockImplementation(() => {
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
      vi.mocked(WeeklySettingsService.getWeeklySettings).mockReturnValue(mockWeeklySettings);
      vi.mocked(WeeklySettingsService.validateWeeklySettings).mockReturnValue(null);
    });

    it('週間設定を更新できること', async () => {
      const updatedSettings = { ...mockWeeklySettings, monday: 'high' as const };
      vi.mocked(WeeklySettingsService.updateWeeklySettings).mockReturnValue(updatedSettings);

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
      expect(WeeklySettingsService.updateWeeklySettings).toHaveBeenCalledWith(mockProject.id, { monday: 'high' });
    });

    it('バリデーションエラー時にnullを返すこと', async () => {
      vi.mocked(WeeklySettingsService.validateWeeklySettings).mockReturnValue('設定が無効です');

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: WeeklySettings | null = null;
      await act(async () => {
        updateResult = await result.current.updateSettings({ monday: 'invalid' as WeeklyDistribution });
      });

      expect(updateResult).toBeNull();
      expect(WeeklySettingsService.updateWeeklySettings).not.toHaveBeenCalled();
    });

    it('設定更新エラー時にnullを返すこと', async () => {
      vi.mocked(WeeklySettingsService.updateWeeklySettings).mockImplementation(() => {
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
    });
  });

  describe('updateDayDistribution', () => {
    beforeEach(() => {
      vi.mocked(WeeklySettingsService.getWeeklySettings).mockReturnValue(mockWeeklySettings);
      vi.mocked(WeeklySettingsService.validateWeeklySettings).mockReturnValue(null);
    });

    it('特定の曜日の配分を更新できること', async () => {
      const updatedSettings = { ...mockWeeklySettings, tuesday: 'low' as const };
      vi.mocked(WeeklySettingsService.updateWeeklySettings).mockReturnValue(updatedSettings);

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
      expect(WeeklySettingsService.updateWeeklySettings).toHaveBeenCalledWith(mockProject.id, { tuesday: 'low' });
    });
  });

  describe('resetToDefault', () => {
    beforeEach(() => {
      vi.mocked(WeeklySettingsService.getWeeklySettings).mockReturnValue(mockWeeklySettings);
      vi.mocked(WeeklySettingsService.validateWeeklySettings).mockReturnValue(null);
    });

    it('デフォルト設定にリセットできること', async () => {
      const defaultSettings: WeeklySettings = {
        projectId: mockProject.id,
        monday: 'normal',
        tuesday: 'normal',
        wednesday: 'normal',
        thursday: 'normal',
        friday: 'normal',
        saturday: 'normal',
        sunday: 'none',
      };
      vi.mocked(WeeklySettingsService.getDefaultWeeklySettings).mockReturnValue(defaultSettings);
      vi.mocked(WeeklySettingsService.updateWeeklySettings).mockReturnValue(defaultSettings);

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
      expect(WeeklySettingsService.getDefaultWeeklySettings).toHaveBeenCalledWith(mockProject.id);
    });
  });

  describe('ユーティリティ関数', () => {
    beforeEach(() => {
      vi.mocked(WeeklySettingsService.getWeeklySettings).mockReturnValue(mockWeeklySettings);
    });

    it('getDistributionLabelが正しく動作すること', async () => {
      vi.mocked(WeeklySettingsService.getDistributionLabel).mockReturnValue('普通');

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const label = result.current.getDistributionLabel('normal');

      expect(label).toBe('普通');
      expect(WeeklySettingsService.getDistributionLabel).toHaveBeenCalledWith('normal');
    });

    it('getDayNameが正しく動作すること', async () => {
      vi.mocked(WeeklySettingsService.getDayOfWeekName).mockReturnValue('月曜日');

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const dayName = result.current.getDayName('monday');

      expect(dayName).toBe('月曜日');
      expect(WeeklySettingsService.getDayOfWeekName).toHaveBeenCalledWith('monday');
    });

    it('getWorkingDaysCountが正しく動作すること', async () => {
      vi.mocked(WeeklySettingsService.getWorkingDaysCount).mockReturnValue(5);

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const workingDays = result.current.getWorkingDaysCount();

      expect(workingDays).toBe(5);
      expect(WeeklySettingsService.getWorkingDaysCount).toHaveBeenCalledWith(mockWeeklySettings);
    });

    it('設定がnullの場合のgetWorkingDaysCountが0を返すこと', async () => {
      vi.mocked(WeeklySettingsService.getWeeklySettings).mockReturnValue(null);

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const workingDays = result.current.getWorkingDaysCount();

      expect(workingDays).toBe(0);
    });

    it('getTotalWeeklyCapacityが正しく動作すること', async () => {
      vi.mocked(WeeklySettingsService.getTotalWeeklyCapacity).mockReturnValue(7.5);

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const totalCapacity = result.current.getTotalWeeklyCapacity(1.5);

      expect(totalCapacity).toBe(7.5);
      expect(WeeklySettingsService.getTotalWeeklyCapacity).toHaveBeenCalledWith(mockWeeklySettings, 1.5);
    });

    it('設定がnullの場合のgetTotalWeeklyCapacityが0を返すこと', async () => {
      vi.mocked(WeeklySettingsService.getWeeklySettings).mockReturnValue(null);

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const totalCapacity = result.current.getTotalWeeklyCapacity();

      expect(totalCapacity).toBe(0);
    });

    it('getDailyCapacityが正しく動作すること', async () => {
      vi.mocked(WeeklySettingsService.getDailyCapacity).mockReturnValue(1.5);

      const { result } = renderHook(() => useWeeklySettings(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const dailyCapacity = result.current.getDailyCapacity('monday', 1.0);

      expect(dailyCapacity).toBe(1.5);
      expect(WeeklySettingsService.getDailyCapacity).toHaveBeenCalledWith(mockWeeklySettings, 'monday', 1.0);
    });

    it('設定がnullの場合のgetDailyCapacityが0を返すこと', async () => {
      vi.mocked(WeeklySettingsService.getWeeklySettings).mockReturnValue(null);

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
      
      vi.mocked(WeeklySettingsService.getWeeklySettings)
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
      expect(WeeklySettingsService.getWeeklySettings).toHaveBeenCalledTimes(2);
    });
  });
});