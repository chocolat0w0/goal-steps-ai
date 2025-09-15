import { describe, it, expect } from 'vitest';
import {
  getCompletedRanges,
  isOverlapping,
  mergeRanges,
  getAvailableRanges,
  generateBlockRanges,
  isValidRange,
  hasNoOverlaps,
  type Range,
} from '../range';
import { type TaskBlock, type Category } from '~/types';

const mockCategory: Category = {
  id: 'category-1',
  projectId: 'project-1',
  name: 'テストカテゴリー',
  valueRange: { min: 0, max: 100 },
  minUnit: 5,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const createMockTaskBlock = (
  start: number,
  end: number,
  completed: boolean = true,
  categoryId: string = 'category-1'
): TaskBlock => ({
  id: `task-${start}-${end}`,
  categoryId,
  projectId: 'project-1',
  date: '2024-06-15',
  amount: end - start,
  start,
  end,
  completed,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
});

describe('range utilities', () => {
  describe('getCompletedRanges', () => {
    it('完了済みタスクブロックから範囲を正しく取得すること', () => {
      const taskBlocks: TaskBlock[] = [
        createMockTaskBlock(10, 15, true),
        createMockTaskBlock(20, 25, true),
        createMockTaskBlock(30, 35, false), // 未完了は除外される
        createMockTaskBlock(40, 45, true, 'other-category'), // 他カテゴリーは除外される
      ];

      const ranges = getCompletedRanges(taskBlocks, 'category-1');

      expect(ranges).toEqual([
        { start: 10, end: 15 },
        { start: 20, end: 25 },
      ]);
    });

    it('完了済みタスクがない場合は空配列を返すこと', () => {
      const taskBlocks: TaskBlock[] = [
        createMockTaskBlock(10, 15, false),
      ];

      const ranges = getCompletedRanges(taskBlocks, 'category-1');

      expect(ranges).toEqual([]);
    });

    it('範囲がstart順にソートされること', () => {
      const taskBlocks: TaskBlock[] = [
        createMockTaskBlock(30, 35, true),
        createMockTaskBlock(10, 15, true),
        createMockTaskBlock(20, 25, true),
      ];

      const ranges = getCompletedRanges(taskBlocks, 'category-1');

      expect(ranges).toEqual([
        { start: 10, end: 15 },
        { start: 20, end: 25 },
        { start: 30, end: 35 },
      ]);
    });
  });

  describe('isOverlapping', () => {
    it('重複する範囲を正しく検出すること', () => {
      expect(isOverlapping({ start: 10, end: 20 }, { start: 15, end: 25 })).toBe(true);
      expect(isOverlapping({ start: 15, end: 25 }, { start: 10, end: 20 })).toBe(true);
      expect(isOverlapping({ start: 10, end: 20 }, { start: 5, end: 15 })).toBe(true);
    });

    it('重複しない範囲を正しく検出すること', () => {
      expect(isOverlapping({ start: 10, end: 15 }, { start: 20, end: 25 })).toBe(false);
      expect(isOverlapping({ start: 20, end: 25 }, { start: 10, end: 15 })).toBe(false);
    });

    it('隣接する範囲は重複していないと判定すること', () => {
      expect(isOverlapping({ start: 10, end: 15 }, { start: 15, end: 20 })).toBe(false);
      expect(isOverlapping({ start: 15, end: 20 }, { start: 10, end: 15 })).toBe(false);
    });
  });

  describe('mergeRanges', () => {
    it('重複する範囲を正しくマージすること', () => {
      const ranges: Range[] = [
        { start: 10, end: 20 },
        { start: 15, end: 25 },
        { start: 30, end: 35 },
      ];

      const merged = mergeRanges(ranges);

      expect(merged).toEqual([
        { start: 10, end: 25 },
        { start: 30, end: 35 },
      ]);
    });

    it('隣接する範囲を正しくマージすること', () => {
      const ranges: Range[] = [
        { start: 10, end: 15 },
        { start: 15, end: 20 },
        { start: 20, end: 25 },
      ];

      const merged = mergeRanges(ranges);

      expect(merged).toEqual([
        { start: 10, end: 25 },
      ]);
    });

    it('重複しない範囲はそのまま保持すること', () => {
      const ranges: Range[] = [
        { start: 10, end: 15 },
        { start: 20, end: 25 },
        { start: 30, end: 35 },
      ];

      const merged = mergeRanges(ranges);

      expect(merged).toEqual(ranges);
    });

    it('空配列の場合は空配列を返すこと', () => {
      const merged = mergeRanges([]);
      expect(merged).toEqual([]);
    });
  });

  describe('getAvailableRanges', () => {
    it('完了済み範囲を除いた利用可能範囲を正しく計算すること', () => {
      const completedRanges: Range[] = [
        { start: 20, end: 30 },
        { start: 50, end: 60 },
      ];

      const availableRanges = getAvailableRanges(mockCategory, completedRanges);

      expect(availableRanges).toEqual([
        { start: 0, end: 20 },
        { start: 30, end: 50 },
        { start: 60, end: 105 },
      ]);
    });

    it('完了済み範囲がない場合は全範囲が利用可能であること', () => {
      const availableRanges = getAvailableRanges(mockCategory, []);

      expect(availableRanges).toEqual([
        { start: 0, end: 105 },
      ]);
    });

    it('完了済み範囲が全範囲を覆う場合は空配列を返すこと', () => {
      const completedRanges: Range[] = [
        { start: 0, end: 105 },
      ];

      const availableRanges = getAvailableRanges(mockCategory, completedRanges);

      expect(availableRanges).toEqual([]);
    });

    it('重複する完了済み範囲を正しく処理すること', () => {
      const completedRanges: Range[] = [
        { start: 10, end: 20 },
        { start: 15, end: 25 },
        { start: 40, end: 50 },
      ];

      const availableRanges = getAvailableRanges(mockCategory, completedRanges);

      expect(availableRanges).toEqual([
        { start: 0, end: 10 },
        { start: 25, end: 40 },
        { start: 50, end: 105 },
      ]);
    });
  });

  describe('generateBlockRanges', () => {
    it('利用可能範囲から指定数のブロック範囲を生成すること', () => {
      const availableRanges: Range[] = [
        { start: 0, end: 20 },
        { start: 30, end: 50 },
      ];

      const blockRanges = generateBlockRanges(availableRanges, 5, 6);

      expect(blockRanges).toEqual([
        { start: 0, end: 5 },
        { start: 5, end: 10 },
        { start: 10, end: 15 },
        { start: 15, end: 20 },
        { start: 30, end: 35 },
        { start: 35, end: 40 },
      ]);
    });

    it('必要なブロック数が利用可能範囲を超える場合は可能な分だけ生成すること', () => {
      const availableRanges: Range[] = [
        { start: 0, end: 10 },
      ];

      const blockRanges = generateBlockRanges(availableRanges, 5, 5);

      expect(blockRanges).toEqual([
        { start: 0, end: 5 },
        { start: 5, end: 10 },
      ]);
    });

    it('利用可能範囲がない場合は空配列を返すこと', () => {
      const blockRanges = generateBlockRanges([], 5, 3);

      expect(blockRanges).toEqual([]);
    });
  });

  describe('isValidRange', () => {
    it('有効な範囲を正しく判定すること', () => {
      expect(isValidRange({ start: 0, end: 10 })).toBe(true);
      expect(isValidRange({ start: 5, end: 15 })).toBe(true);
    });

    it('無効な範囲を正しく判定すること', () => {
      expect(isValidRange({ start: 10, end: 5 })).toBe(false);
      expect(isValidRange({ start: 10, end: 10 })).toBe(false);
      expect(isValidRange({ start: -5, end: 10 })).toBe(false);
    });
  });

  describe('hasNoOverlaps', () => {
    it('重複のない範囲リストを正しく判定すること', () => {
      const ranges: Range[] = [
        { start: 0, end: 10 },
        { start: 15, end: 20 },
        { start: 25, end: 30 },
      ];

      expect(hasNoOverlaps(ranges)).toBe(true);
    });

    it('重複のある範囲リストを正しく判定すること', () => {
      const ranges: Range[] = [
        { start: 0, end: 10 },
        { start: 5, end: 15 },
        { start: 20, end: 25 },
      ];

      expect(hasNoOverlaps(ranges)).toBe(false);
    });

    it('空配列の場合はtrueを返すこと', () => {
      expect(hasNoOverlaps([])).toBe(true);
    });

    it('単一範囲の場合はtrueを返すこと', () => {
      const ranges: Range[] = [{ start: 0, end: 10 }];
      expect(hasNoOverlaps(ranges)).toBe(true);
    });
  });
});