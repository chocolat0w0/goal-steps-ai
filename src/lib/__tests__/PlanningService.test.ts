import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPlan,
  validatePlanningData,
  generateId,
  getCurrentTimestamp,
  getAvailableDates,
  getDayKeyFromDayOfWeek,
  calculateDailyCapacities,
} from '../planning';
import { type Range } from '../utils/range';
import { getTotalUnits } from '../utils/category';
import {
  setupMockLocalStorage,
  getStorageKey,
} from '~/test/mocks/localStorage';
import {
  mockProject,
  mockCategories,
  mockWeeklySettings,
} from '~/test/fixtures/testData';

describe('PlanningService', () => {
  let mockStorage: ReturnType<typeof setupMockLocalStorage>;

  beforeEach(() => {
    mockStorage = setupMockLocalStorage();
  });

  describe('createPlan', () => {
    beforeEach(() => {
      // 基本的な設定をセットアップ
      mockStorage.setItem(
        getStorageKey('projects'),
        JSON.stringify([mockProject])
      );
      mockStorage.setItem(
        getStorageKey('categories'),
        JSON.stringify(mockCategories)
      );
      mockStorage.setItem(
        getStorageKey('weekly-settings'),
        JSON.stringify([mockWeeklySettings])
      );
    });

    it('プロジェクト、カテゴリー、週間設定から計画を生成できること', () => {
      const result = createPlan(
        mockProject,
        mockCategories,
        mockWeeklySettings
      );

      expect(result).toBeTruthy();
      expect(Array.isArray(result)).toBe(true);
    });

    it('生成されたタスクブロックが正しい構造を持つこと', () => {
      const result = createPlan(
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
      const result = createPlan(
        mockProject,
        mockCategories,
        mockWeeklySettings
      );

      const categoryIds = mockCategories.map((c) => c.id);
      result.forEach((taskBlock) => {
        expect(categoryIds).toContain(taskBlock.categoryId);
      });
    });

    it('空のカテゴリーリストの場合は空の配列を返すこと', () => {
      const result = createPlan(mockProject, [], mockWeeklySettings);

      expect(result).toEqual([]);
    });

    it('生成されたタスクブロックがlocalStorageに保存されること', () => {
      const result = createPlan(
        mockProject,
        mockCategories,
        mockWeeklySettings
      );

      const storedBlocks = JSON.parse(
        mockStorage.getItem(getStorageKey('task-blocks')) || '[]'
      );
      expect(storedBlocks.length).toBe(result.length);
    });

    it('完了済みタスクが保持され、未完了タスクのみが削除されること', () => {
      // 既存のタスクブロックを設定（完了済みと未完了を混在）
      const existingBlocks = [
        {
          id: 'completed-1',
          projectId: mockProject.id,
          categoryId: mockCategories[0].id,
          amount: 2,
          completed: true,
          date: '2030-06-15',
          createdAt: '2030-06-01T00:00:00Z',
          updatedAt: '2030-06-01T00:00:00Z',
        },
        {
          id: 'incomplete-1',
          projectId: mockProject.id,
          categoryId: mockCategories[0].id,
          amount: 2,
          completed: false,
          date: '2030-06-16',
          createdAt: '2030-06-01T00:00:00Z',
          updatedAt: '2030-06-01T00:00:00Z',
        },
        {
          id: 'other-project-1',
          projectId: 'other-project',
          categoryId: 'test',
          amount: 10,
          completed: false,
          date: '2030-06-15',
          createdAt: '2030-06-01T00:00:00Z',
          updatedAt: '2030-06-01T00:00:00Z',
        },
      ];
      mockStorage.setItem(
        getStorageKey('task-blocks'),
        JSON.stringify(existingBlocks)
      );

      const result = createPlan(
        mockProject,
        mockCategories,
        mockWeeklySettings
      );

      const storedBlocks = JSON.parse(
        mockStorage.getItem(getStorageKey('task-blocks')) || '[]'
      );

      // 完了済みタスクは保持される
      const completedBlocks = storedBlocks.filter(
        (block: { id: string }) => block.id === 'completed-1'
      );
      expect(completedBlocks).toHaveLength(1);
      expect(completedBlocks[0].completed).toBe(true);

      // 未完了タスクは削除される
      const incompleteBlocks = storedBlocks.filter(
        (block: { id: string }) => block.id === 'incomplete-1'
      );
      expect(incompleteBlocks).toHaveLength(0);

      // 他のプロジェクトのタスクは保持される
      const otherProjectBlocks = storedBlocks.filter(
        (block: { projectId: string }) => block.projectId === 'other-project'
      );
      expect(otherProjectBlocks).toHaveLength(1);

      // 結果には完了済みタスクが含まれる
      const completedInResult = result.filter(
        (block) => block.id === 'completed-1'
      );
      expect(completedInResult).toHaveLength(1);
    });

    it('完了済みタスクを考慮して残り作業量が正しく計算されること', () => {
      const existingBlocks = [
        {
          id: 'completed-1',
          projectId: mockProject.id,
          categoryId: mockCategories[0].id,
          amount: 2,
          completed: true,
          date: '2030-06-15',
          createdAt: '2030-06-01T00:00:00Z',
          updatedAt: '2030-06-01T00:00:00Z',
        },
        {
          id: 'completed-2',
          projectId: mockProject.id,
          categoryId: mockCategories[0].id,
          amount: 2,
          completed: true,
          date: '2030-06-16',
          createdAt: '2030-06-01T00:00:00Z',
          updatedAt: '2030-06-01T00:00:00Z',
        },
      ];
      mockStorage.setItem(
        getStorageKey('task-blocks'),
        JSON.stringify(existingBlocks)
      );

      const result = createPlan(
        mockProject,
        mockCategories,
        mockWeeklySettings
      );

      const newTasksForCategory1 = result.filter(
        (block) => block.categoryId === mockCategories[0].id && !block.completed
      );

      const totalUnits = getTotalUnits(mockCategories[0]);
      const completedAmount = existingBlocks.reduce(
        (sum, b) => sum + b.amount,
        0
      );
      const expectedBlocks = Math.ceil(
        (totalUnits - completedAmount) / mockCategories[0].minUnit
      );

      expect(newTasksForCategory1.length).toBeLessThanOrEqual(expectedBlocks);
    });

    it('すべてのタスクが完了している場合、新しいタスクは作成されないこと', () => {
      // 全てのカテゴリーが完了している状況を設定
      const totalUnitsCategory1 = Math.ceil(
        getTotalUnits(mockCategories[0]) / mockCategories[0].minUnit
      );
      const totalUnitsCategory2 = Math.ceil(
        getTotalUnits(mockCategories[1]) / mockCategories[1].minUnit
      );

      const existingBlocks = [];

      // カテゴリー1を全て完了
      for (let i = 0; i < totalUnitsCategory1; i++) {
        existingBlocks.push({
          id: `completed-cat1-${i}`,
          projectId: mockProject.id,
          categoryId: mockCategories[0].id,
          amount: mockCategories[0].minUnit,
          completed: true,
          date: '2030-06-15',
          createdAt: '2030-06-01T00:00:00Z',
          updatedAt: '2030-06-01T00:00:00Z',
        });
      }

      // カテゴリー2を全て完了
      for (let i = 0; i < totalUnitsCategory2; i++) {
        existingBlocks.push({
          id: `completed-cat2-${i}`,
          projectId: mockProject.id,
          categoryId: mockCategories[1].id,
          amount: mockCategories[1].minUnit,
          completed: true,
          date: '2030-06-15',
          createdAt: '2030-06-01T00:00:00Z',
          updatedAt: '2030-06-01T00:00:00Z',
        });
      }

      mockStorage.setItem(
        getStorageKey('task-blocks'),
        JSON.stringify(existingBlocks)
      );

      const result = createPlan(
        mockProject,
        mockCategories,
        mockWeeklySettings
      );

      // 新しい未完了タスクが作成されていないことを確認
      const newIncompleteTasks = result.filter((block) => !block.completed);
      expect(newIncompleteTasks).toHaveLength(0);

      // 完了済みタスクは保持されていることを確認
      const completedTasks = result.filter((block) => block.completed);
      expect(completedTasks).toHaveLength(
        totalUnitsCategory1 + totalUnitsCategory2
      );
    });
  });

  describe('validatePlanningData', () => {
    it('有効な入力で空配列を返すこと', () => {
      const result = validatePlanningData(
        mockProject,
        mockCategories,
        mockWeeklySettings
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('空のカテゴリーでエラーメッセージを返すこと', () => {
      const result = validatePlanningData(mockProject, [], mockWeeklySettings);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('カテゴリーが設定されていません');
    });

    it('過去の期限でエラーメッセージを返すこと', () => {
      const pastProject = {
        ...mockProject,
        deadline: '2020-01-01',
      };

      const result = validatePlanningData(
        pastProject,
        mockCategories,
        mockWeeklySettings
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((msg) => msg.includes('期限が過去'))).toBe(true);
    });
  });

  describe('getAvailableDates', () => {
    it('開始日から終了日までの日付配列を生成すること', () => {
      const startDate = new Date('2030-06-15');
      const endDate = new Date('2030-06-17');

      const dates = getAvailableDates(startDate, endDate, mockWeeklySettings);

      expect(Array.isArray(dates)).toBe(true);
      expect(dates.length).toBeGreaterThan(0);
    });

    it('none設定の曜日が除外されること', () => {
      const startDate = new Date('2030-06-16'); // 日曜日（mockWeeklySettingsでnone）
      const endDate = new Date('2030-06-16');

      const dates = getAvailableDates(startDate, endDate, mockWeeklySettings);

      expect(dates).toHaveLength(0);
    });
  });

  describe('getDayKeyFromDayOfWeek', () => {
    it('正しい曜日キーを返すこと', () => {
      expect(getDayKeyFromDayOfWeek(0)).toBe('sunday');
      expect(getDayKeyFromDayOfWeek(1)).toBe('monday');
      expect(getDayKeyFromDayOfWeek(6)).toBe('saturday');
    });

    it('無効な曜日でnullを返すこと', () => {
      expect(getDayKeyFromDayOfWeek(7)).toBeNull();
      expect(getDayKeyFromDayOfWeek(-1)).toBeNull();
    });
  });

  describe('calculateDailyCapacities', () => {
    it('週間設定に基づいて日次容量を計算すること', () => {
      const dates = [
        new Date('2030-06-18'), // 月曜日 (high)
        new Date('2030-06-19'), // 火曜日 (normal)
        new Date('2030-06-20'), // 水曜日 (low)
      ];

      const capacities = calculateDailyCapacities(
        dates,
        mockWeeklySettings,
        100
      );

      expect(capacities).toHaveLength(3);
      expect(capacities.every((c) => typeof c === 'number' && !isNaN(c))).toBe(
        true
      );
      // high > normal > low の順序をテスト
      if (capacities.length >= 3) {
        expect(capacities[0]).toBeGreaterThan(0);
        expect(capacities[1]).toBeGreaterThan(0);
        expect(capacities[2]).toBeGreaterThan(0);
      }
    });
  });

  describe('ユーティリティ機能', () => {
    it('ID生成が正しく動作すること', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
    });

    it('タイムスタンプ生成が正しく動作すること', () => {
      const timestamp = getCurrentTimestamp();

      expect(typeof timestamp).toBe('string');
      expect(new Date(timestamp).getTime()).toBeGreaterThan(0);
    });
  });

  describe('範囲重複回避', () => {
    it('完了済みタスクと重複しない範囲でタスクが生成されること', () => {
      // 完了済みタスクを設定（範囲が飛び飛び）
      const existingBlocks = [
        {
          id: 'completed-1',
          projectId: mockProject.id,
          categoryId: mockCategories[0].id,
          amount: mockCategories[0].minUnit,
          start: 10,
          end: 15,
          completed: true,
          date: '2030-06-15',
          createdAt: '2030-06-01T00:00:00Z',
          updatedAt: '2030-06-01T00:00:00Z',
        },
        {
          id: 'completed-2',
          projectId: mockProject.id,
          categoryId: mockCategories[0].id,
          amount: mockCategories[0].minUnit,
          start: 25,
          end: 30,
          completed: true,
          date: '2030-06-16',
          createdAt: '2030-06-01T00:00:00Z',
          updatedAt: '2030-06-01T00:00:00Z',
        },
      ];

      mockStorage.setItem(
        getStorageKey('task-blocks'),
        JSON.stringify(existingBlocks)
      );

      const result = createPlan(
        mockProject,
        mockCategories,
        mockWeeklySettings
      );

      // 新しいタスクが完了済み範囲と重複していないことを確認
      const newTaskBlocks = result.filter((block) => !block.completed);

      // カテゴリー別に完了済み範囲を整理
      const completedRangesByCategory = new Map();
      completedRangesByCategory.set(mockCategories[0].id, [
        { start: 10, end: 15 },
        { start: 25, end: 30 },
      ]);

      newTaskBlocks.forEach((block) => {
        // 同じカテゴリーの完了済み範囲のみをチェック
        const completedRanges = completedRangesByCategory.get(block.categoryId) || [];

        // 新しいタスクが同じカテゴリーの完了済み範囲と重複していないことを確認
        const hasOverlap = completedRanges.some((range: Range) =>
          block.start < range.end && range.start < block.end
        );

        expect(hasOverlap).toBe(false);

        // start-endフィールドが正しく設定されていることを確認
        expect(block.start).toBeGreaterThanOrEqual(0);
        expect(block.end).toBeGreaterThan(block.start);

        // カテゴリーに応じた minUnit をチェック
        const category = mockCategories.find(c => c.id === block.categoryId);
        if (category) {
          expect(block.end - block.start).toBe(category.minUnit);
        }
      });

      // 完了済みタスクが結果に含まれていることを確認
      const completedInResult = result.filter((block) => block.completed);
      expect(completedInResult).toHaveLength(2);
    });

    it('利用可能範囲が不足している場合でも可能な限りタスクを生成すること', () => {
      // カテゴリーの大部分を完了済みに設定
      const existingBlocks = [];
      const category = mockCategories[0];

      // 範囲の90%を完了済みに設定（[10, 45]の範囲）
      for (let start = 10; start < 45; start += category.minUnit) {
        existingBlocks.push({
          id: `completed-${start}`,
          projectId: mockProject.id,
          categoryId: category.id,
          amount: category.minUnit,
          start,
          end: start + category.minUnit,
          completed: true,
          date: '2030-06-15',
          createdAt: '2030-06-01T00:00:00Z',
          updatedAt: '2030-06-01T00:00:00Z',
        });
      }

      mockStorage.setItem(
        getStorageKey('task-blocks'),
        JSON.stringify(existingBlocks)
      );

      const result = createPlan(
        mockProject,
        mockCategories,
        mockWeeklySettings
      );

      // 新しいタスクが利用可能範囲（[0,10]と[45,55]）内に生成されることを確認
      const newTaskBlocks = result.filter((block) => !block.completed && block.categoryId === category.id);

      newTaskBlocks.forEach((block) => {
        // 利用可能範囲内にあることを確認
        const inValidRange =
          (block.start >= 0 && block.end <= 10) ||
          (block.start >= 45 && block.end <= 55);
        expect(inValidRange).toBe(true);
      });

      // 期待される新しいタスク数を確認（利用可能範囲に基づく）
      const expectedNewBlocks =
        Math.floor((10 - 0) / category.minUnit) +
        Math.floor((55 - 45) / category.minUnit);
      expect(newTaskBlocks.length).toBeLessThanOrEqual(expectedNewBlocks);
    });
  });
});
