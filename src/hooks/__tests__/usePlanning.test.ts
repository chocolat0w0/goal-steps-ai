import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlanning } from '../usePlanning';
import * as planningService from '~/lib/planning';
import { setupMockLocalStorage } from '~/test/mocks/localStorage';
import {
  mockProject,
  mockCategories,
  mockWeeklySettings,
} from '~/test/fixtures/testData';
import { type TaskBlock } from '~/types';

// PlanningServiceのモック
vi.mock('~/lib/planning', () => ({
  validatePlanningData: vi.fn(),
  createPlan: vi.fn(),
}));

describe('usePlanning', () => {
  const mockTaskBlocks: TaskBlock[] = [
    {
      id: 'task-1',
      categoryId: mockCategories[0].id,
      projectId: mockProject.id,
      date: '2030-06-15',
      amount: 2,
      completed: false,
      createdAt: '2030-06-01T00:00:00.000Z',
      updatedAt: '2030-06-01T00:00:00.000Z',
    },
    {
      id: 'task-2',
      categoryId: mockCategories[0].id,
      projectId: mockProject.id,
      date: '2030-06-16',
      amount: 2,
      completed: false,
      createdAt: '2030-06-01T00:00:00.000Z',
      updatedAt: '2030-06-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    setupMockLocalStorage();
    vi.clearAllMocks();
  });

  describe('初期化', () => {
    it('フックの初期状態が正しいこと', () => {
      const { result } = renderHook(() => usePlanning());

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.lastGeneratedPlan).toEqual([]);
      expect(typeof result.current.generatePlan).toBe('function');
      expect(typeof result.current.validatePlanningData).toBe('function');
      expect(typeof result.current.getPlanSummary).toBe('function');
    });
  });

  describe('generatePlan', () => {
    it('有効な入力で計画を生成できること', async () => {
      vi.mocked(planningService.validatePlanningData).mockReturnValue([]);
      vi.mocked(planningService.createPlan).mockReturnValue(mockTaskBlocks);

      const { result } = renderHook(() => usePlanning());

      expect(result.current.isGenerating).toBe(false);

      let generateResult: {
        success: boolean;
        errors: string[];
        blocks: TaskBlock[];
      } = {
        success: false,
        errors: [],
        blocks: [],
      };
      await act(async () => {
        generateResult = await result.current.generatePlan(
          mockProject,
          mockCategories,
          mockWeeklySettings
        );
      });

      expect(generateResult.success).toBe(true);
      expect(generateResult.errors).toEqual([]);
      expect(generateResult.blocks).toEqual(mockTaskBlocks);
      expect(result.current.lastGeneratedPlan).toEqual(mockTaskBlocks);
      expect(result.current.isGenerating).toBe(false);

      expect(planningService.validatePlanningData).toHaveBeenCalledWith(
        mockProject,
        mockCategories,
        mockWeeklySettings
      );
      expect(planningService.createPlan).toHaveBeenCalledWith(
        mockProject,
        mockCategories,
        mockWeeklySettings,
        undefined
      );
    });

    it('オプション付きで計画を生成できること', async () => {
      const options = {
        respectCategoryDeadlines: true,
        prioritizeWeeklyDistribution: false,
      };
      vi.mocked(planningService.validatePlanningData).mockReturnValue([]);
      vi.mocked(planningService.createPlan).mockReturnValue(mockTaskBlocks);

      const { result } = renderHook(() => usePlanning());

      let generateResult: {
        success: boolean;
        errors: string[];
        blocks: TaskBlock[];
      } = {
        success: false,
        errors: [],
        blocks: [],
      };
      await act(async () => {
        generateResult = await result.current.generatePlan(
          mockProject,
          mockCategories,
          mockWeeklySettings,
          options
        );
      });

      expect(generateResult.success).toBe(true);
      expect(planningService.createPlan).toHaveBeenCalledWith(
        mockProject,
        mockCategories,
        mockWeeklySettings,
        options
      );
    });

    it('バリデーションエラー時に失敗レスポンスを返すこと', async () => {
      const validationErrors = [
        'カテゴリーが設定されていません',
        '期限が過去の日付です',
      ];
      vi.mocked(planningService.validatePlanningData).mockReturnValue(
        validationErrors
      );

      const { result } = renderHook(() => usePlanning());

      let generateResult: {
        success: boolean;
        errors: string[];
        blocks: TaskBlock[];
      } = {
        success: false,
        errors: [],
        blocks: [],
      };
      await act(async () => {
        generateResult = await result.current.generatePlan(
          mockProject,
          [],
          mockWeeklySettings
        );
      });

      expect(generateResult.success).toBe(false);
      expect(generateResult.errors).toEqual(validationErrors);
      expect(generateResult.blocks).toEqual([]);
      expect(result.current.lastGeneratedPlan).toEqual([]);
      expect(planningService.createPlan).not.toHaveBeenCalled();
    });

    it('計画生成エラー時に失敗レスポンスを返すこと', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      vi.mocked(planningService.validatePlanningData).mockReturnValue([]);
      vi.mocked(planningService.createPlan).mockImplementation(() => {
        throw new Error('計画生成に失敗しました');
      });

      const { result } = renderHook(() => usePlanning());

      let generateResult: {
        success: boolean;
        errors: string[];
        blocks: TaskBlock[];
      } = {
        success: false,
        errors: [],
        blocks: [],
      };
      await act(async () => {
        generateResult = await result.current.generatePlan(
          mockProject,
          mockCategories,
          mockWeeklySettings
        );
      });

      expect(generateResult.success).toBe(false);
      expect(generateResult.errors).toEqual(['計画生成に失敗しました']);
      expect(generateResult.blocks).toEqual([]);
      expect(result.current.lastGeneratedPlan).toEqual([]);

      consoleSpy.mockRestore();
    });

    it('不明なエラー時にデフォルトメッセージを返すこと', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      vi.mocked(planningService.validatePlanningData).mockReturnValue([]);
      vi.mocked(planningService.createPlan).mockImplementation(() => {
        throw 'Unknown error';
      });

      const { result } = renderHook(() => usePlanning());

      let generateResult: {
        success: boolean;
        errors: string[];
        blocks: TaskBlock[];
      } = {
        success: false,
        errors: [],
        blocks: [],
      };
      await act(async () => {
        generateResult = await result.current.generatePlan(
          mockProject,
          mockCategories,
          mockWeeklySettings
        );
      });

      expect(generateResult.success).toBe(false);
      expect(generateResult.errors).toEqual([
        '計画生成中にエラーが発生しました',
      ]);
      expect(generateResult.blocks).toEqual([]);

      consoleSpy.mockRestore();
    });

    it('生成中のisGeneratingフラグが正しく管理されること', async () => {
      vi.mocked(planningService.validatePlanningData).mockReturnValue([]);
      vi.mocked(planningService.createPlan).mockReturnValue(mockTaskBlocks);

      const { result } = renderHook(() => usePlanning());

      expect(result.current.isGenerating).toBe(false);

      // act内でasync関数を呼び出し、isGeneratingの変化を確認
      await act(async () => {
        const promise = result.current.generatePlan(
          mockProject,
          mockCategories,
          mockWeeklySettings
        );
        // Promiseが開始されている間はisGeneratingがtrueになる
        // ただし、即座に完了するため、ここでの確認は難しい
        await promise;
      });

      // 生成完了後はisGeneratingがfalseになる
      expect(result.current.isGenerating).toBe(false);
    });
  });

  describe('validatePlanningData', () => {
    it('バリデーション結果を正しく返すこと', () => {
      const expectedErrors = ['エラーメッセージ1', 'エラーメッセージ2'];
      vi.mocked(planningService.validatePlanningData).mockReturnValue(
        expectedErrors
      );

      const { result } = renderHook(() => usePlanning());

      const errors = result.current.validatePlanningData(
        mockProject,
        mockCategories,
        mockWeeklySettings
      );

      expect(errors).toEqual(expectedErrors);
      expect(planningService.validatePlanningData).toHaveBeenCalledWith(
        mockProject,
        mockCategories,
        mockWeeklySettings
      );
    });

    it('エラーがない場合は空配列を返すこと', () => {
      vi.mocked(planningService.validatePlanningData).mockReturnValue([]);

      const { result } = renderHook(() => usePlanning());

      const errors = result.current.validatePlanningData(
        mockProject,
        mockCategories,
        mockWeeklySettings
      );

      expect(errors).toEqual([]);
    });
  });

  describe('getPlanSummary', () => {
    it('空のブロック配列で正しいサマリーを返すこと', () => {
      const { result } = renderHook(() => usePlanning());

      const summary = result.current.getPlanSummary([]);

      expect(summary.totalBlocks).toBe(0);
      expect(summary.dateRange).toBeNull();
      expect(summary.dailyBreakdown).toEqual({});
    });

    it('タスクブロックありで正しいサマリーを返すこと', () => {
      const { result } = renderHook(() => usePlanning());

      const summary = result.current.getPlanSummary(mockTaskBlocks);

      expect(summary.totalBlocks).toBe(2);
      expect(summary.dateRange).not.toBeNull();
      expect(summary.dateRange?.start).toEqual(new Date('2030-06-15'));
      expect(summary.dateRange?.end).toEqual(new Date('2030-06-16'));
      expect(summary.dailyBreakdown).toEqual({
        '2030-06-15': 1,
        '2030-06-16': 1,
      });
    });

    it('同じ日に複数のタスクブロックがある場合の集計が正しいこと', () => {
      const blocksWithSameDate: TaskBlock[] = [
        ...mockTaskBlocks,
        {
          id: 'task-3',
          categoryId: mockCategories[0].id,
          projectId: mockProject.id,
          date: '2030-06-15',
          amount: 1,
          completed: false,
          createdAt: '2030-06-01T00:00:00.000Z',
          updatedAt: '2030-06-01T00:00:00.000Z',
        },
      ];

      const { result } = renderHook(() => usePlanning());

      const summary = result.current.getPlanSummary(blocksWithSameDate);

      expect(summary.totalBlocks).toBe(3);
      expect(summary.dailyBreakdown).toEqual({
        '2030-06-15': 2,
        '2030-06-16': 1,
      });
    });
  });
});
