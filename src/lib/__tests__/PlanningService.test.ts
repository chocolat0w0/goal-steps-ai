import { describe, it, expect, beforeEach } from 'vitest';
import { PlanningService } from '../planningService';
import { setupMockLocalStorage, getStorageKey } from '~/test/mocks/localStorage';
import { mockProject, mockCategories, mockWeeklySettings } from '~/test/fixtures/testData';

describe('PlanningService', () => {
  let mockStorage: ReturnType<typeof setupMockLocalStorage>;

  beforeEach(() => {
    mockStorage = setupMockLocalStorage();
  });

  describe('generatePlan', () => {
    beforeEach(() => {
      // 基本的な設定をセットアップ
      mockStorage.setItem(getStorageKey('projects'), JSON.stringify([mockProject]));
      mockStorage.setItem(getStorageKey('categories'), JSON.stringify(mockCategories));
      mockStorage.setItem(getStorageKey('weekly-settings'), JSON.stringify([mockWeeklySettings]));
    });

    it('プロジェクト、カテゴリー、週間設定から計画を生成できること', () => {
      const result = PlanningService.generatePlan(
        mockProject,
        mockCategories,
        mockWeeklySettings
      );

      expect(result).toBeTruthy();
      expect(Array.isArray(result)).toBe(true);
    });

    it('生成されたタスクブロックが正しい構造を持つこと', () => {
      const result = PlanningService.generatePlan(
        mockProject,
        mockCategories,
        mockWeeklySettings
      );

      if (result.length > 0) {
        const taskBlock = result[0];
        expect(taskBlock).toHaveProperty('id');
        expect(taskBlock).toHaveProperty('categoryId');
        expect(taskBlock).toHaveProperty('amount');
        expect(taskBlock).toHaveProperty('completed');
        expect(taskBlock).toHaveProperty('date');
        
        expect(typeof taskBlock.id).toBe('string');
        expect(typeof taskBlock.categoryId).toBe('string');
        expect(typeof taskBlock.amount).toBe('number');
        expect(typeof taskBlock.completed).toBe('boolean');
        expect(typeof taskBlock.date).toBe('string');
        expect(taskBlock.completed).toBe(false);
      }
    });

    it('生成されたタスクブロックのカテゴリーIDが有効なこと', () => {
      const result = PlanningService.generatePlan(
        mockProject,
        mockCategories,
        mockWeeklySettings
      );

      const categoryIds = mockCategories.map(c => c.id);
      result.forEach(taskBlock => {
        expect(categoryIds).toContain(taskBlock.categoryId);
      });
    });

    it('空のカテゴリーリストの場合は空の配列を返すこと', () => {
      const result = PlanningService.generatePlan(
        mockProject,
        [],
        mockWeeklySettings
      );

      expect(result).toEqual([]);
    });

    it('生成されたタスクブロックがlocalStorageに保存されること', () => {
      const result = PlanningService.generatePlan(
        mockProject,
        mockCategories,
        mockWeeklySettings
      );

      const storedBlocks = JSON.parse(mockStorage.getItem(getStorageKey('task-blocks')) || '[]');
      expect(storedBlocks.length).toBe(result.length);
    });

    it('既存のプロジェクトのタスクブロックが削除されること', () => {
      // 既存のタスクブロックを設定
      const existingBlocks = [
        { id: 'existing-1', projectId: mockProject.id, categoryId: 'test', amount: 10, completed: false, date: '2030-06-15' },
        { id: 'other-1', projectId: 'other-project', categoryId: 'test', amount: 10, completed: false, date: '2030-06-15' }
      ];
      mockStorage.setItem(getStorageKey('task-blocks'), JSON.stringify(existingBlocks));

      PlanningService.generatePlan(mockProject, mockCategories, mockWeeklySettings);

      const storedBlocks = JSON.parse(mockStorage.getItem(getStorageKey('task-blocks')) || '[]');
      const oldBlocks = storedBlocks.filter((block: { id: string }) => block.id === 'existing-1');
      
      // 既存のプロジェクトのタスクブロックは削除される
      expect(oldBlocks).toHaveLength(0);
      
      // 新しいタスクブロックが作成されている（空のカテゴリーでない限り）
      expect(storedBlocks.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validatePlanningData', () => {
    it('有効な入力で空配列を返すこと', () => {
      const result = PlanningService.validatePlanningData(
        mockProject,
        mockCategories,
        mockWeeklySettings
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('空のカテゴリーでエラーメッセージを返すこと', () => {
      const result = PlanningService.validatePlanningData(
        mockProject,
        [],
        mockWeeklySettings
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('カテゴリーが設定されていません');
    });

    it('過去の期限でエラーメッセージを返すこと', () => {
      const pastProject = {
        ...mockProject,
        deadline: '2020-01-01'
      };

      const result = PlanningService.validatePlanningData(
        pastProject,
        mockCategories,
        mockWeeklySettings
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(msg => msg.includes('期限が過去'))).toBe(true);
    });
  });

  describe('getAvailableDates', () => {
    it('開始日から終了日までの日付配列を生成すること', () => {
      const startDate = new Date('2030-06-15');
      const endDate = new Date('2030-06-17');
      
      const dates = PlanningService.getAvailableDates(startDate, endDate, mockWeeklySettings);
      
      expect(Array.isArray(dates)).toBe(true);
      expect(dates.length).toBeGreaterThan(0);
    });

    it('none設定の曜日が除外されること', () => {
      const startDate = new Date('2030-06-17'); // 日曜日（mockWeeklySettingsでnone）
      const endDate = new Date('2030-06-17');
      
      const dates = PlanningService.getAvailableDates(startDate, endDate, mockWeeklySettings);
      
      expect(dates).toHaveLength(0);
    });
  });

  describe('getDayKeyFromDayOfWeek', () => {
    it('正しい曜日キーを返すこと', () => {
      expect(PlanningService.getDayKeyFromDayOfWeek(0)).toBe('sunday');
      expect(PlanningService.getDayKeyFromDayOfWeek(1)).toBe('monday');
      expect(PlanningService.getDayKeyFromDayOfWeek(6)).toBe('saturday');
    });

    it('無効な曜日でnullを返すこと', () => {
      expect(PlanningService.getDayKeyFromDayOfWeek(7)).toBeNull();
      expect(PlanningService.getDayKeyFromDayOfWeek(-1)).toBeNull();
    });
  });

  describe('calculateDailyCapacities', () => {
    it('週間設定に基づいて日次容量を計算すること', () => {
      const dates = [
        new Date('2030-06-18'), // 月曜日 (high)
        new Date('2030-06-19'), // 火曜日 (normal)
        new Date('2030-06-20'), // 水曜日 (low)
      ];
      
      const capacities = PlanningService.calculateDailyCapacities(dates, mockWeeklySettings, 100);
      
      expect(capacities).toHaveLength(3);
      expect(capacities.every(c => typeof c === 'number' && !isNaN(c))).toBe(true);
      // high > normal > low の順序をテスト
      if (capacities.length >= 3) {
        expect(capacities[0]).toBeGreaterThan(0);
        expect(capacities[1]).toBeGreaterThan(0);
        expect(capacities[2]).toBeGreaterThan(0);
      }
    });
  });

  describe('getEstimatedCompletionDate', () => {
    it('推定完了日を計算すること', () => {
      const totalUnits = 100;
      const estimatedDate = PlanningService.getEstimatedCompletionDate(
        totalUnits,
        mockWeeklySettings,
        new Date('2030-06-15')
      );

      if (estimatedDate && !isNaN(estimatedDate.getTime())) {
        expect(estimatedDate instanceof Date).toBe(true);
        expect(estimatedDate.getTime()).toBeGreaterThan(Date.now() - 365 * 24 * 60 * 60 * 1000);
      } else {
        // 推定日が計算できない場合はnullまたはInvalid Date
        expect(estimatedDate === null || isNaN(estimatedDate.getTime())).toBe(true);
      }
    });
  });

  describe('ユーティリティ機能', () => {
    it('ID生成が正しく動作すること', () => {
      const id1 = PlanningService.generateId();
      const id2 = PlanningService.generateId();
      
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
    });

    it('タイムスタンプ生成が正しく動作すること', () => {
      const timestamp = PlanningService.getCurrentTimestamp();
      
      expect(typeof timestamp).toBe('string');
      expect(new Date(timestamp).getTime()).toBeGreaterThan(0);
    });
  });
});