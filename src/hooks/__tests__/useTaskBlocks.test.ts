import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTaskBlocks } from '../useTaskBlocks';
import { getTaskBlocks, saveTaskBlocks } from '~/lib/storage';
import { setupMockLocalStorage } from '~/test/mocks/localStorage';
import { mockProject, mockCategory } from '~/test/fixtures/testData';
import { type TaskBlock } from '~/types';

// Storageのモック
vi.mock('~/lib/storage', () => ({
  getTaskBlocks: vi.fn(),
  saveTaskBlocks: vi.fn(),
}));

describe('useTaskBlocks', () => {
  const mockTaskBlocks: TaskBlock[] = [
    {
      id: 'task-1',
      categoryId: mockCategory.id,
      projectId: mockProject.id,
      date: '2030-06-15',
      amount: 2,
      completed: false,
      createdAt: '2030-06-01T00:00:00.000Z',
      updatedAt: '2030-06-01T00:00:00.000Z',
    },
    {
      id: 'task-2',
      categoryId: mockCategory.id,
      projectId: mockProject.id,
      date: '2030-06-15',
      amount: 2,
      completed: true,
      createdAt: '2030-06-01T00:00:00.000Z',
      updatedAt: '2030-06-01T00:00:00.000Z',
    },
    {
      id: 'task-3',
      categoryId: 'other-category',
      projectId: mockProject.id,
      date: '2030-06-16',
      amount: 3,
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
    it('フックの初期状態が正しいこと', async () => {
      vi.mocked(getTaskBlocks).mockReturnValue([]);

      const { result } = renderHook(() => useTaskBlocks(mockProject.id));

      expect(result.current.taskBlocks).toEqual([]);
      expect(typeof result.current.loadTaskBlocks).toBe('function');
      expect(typeof result.current.updateTaskBlock).toBe('function');
      expect(typeof result.current.moveTaskBlock).toBe('function');
      expect(typeof result.current.toggleTaskCompletion).toBe('function');
      expect(typeof result.current.getTaskBlocksByDate).toBe('function');
      expect(typeof result.current.getTaskBlocksByCategory).toBe('function');
      expect(typeof result.current.getProgressByCategory).toBe('function');
      expect(typeof result.current.getOverallProgress).toBe('function');
      expect(typeof result.current.getDateRange).toBe('function');
      expect(typeof result.current.refreshTaskBlocks).toBe('function');

      // ローディングが完了するまで待機
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('初期化時にプロジェクトのタスクブロックを読み込むこと', async () => {
      vi.mocked(getTaskBlocks).mockReturnValue(mockTaskBlocks);

      const { result } = renderHook(() => useTaskBlocks(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(getTaskBlocks).toHaveBeenCalledWith(mockProject.id);
      expect(result.current.taskBlocks).toEqual(mockTaskBlocks);
    });

    it('projectIdが変更された時に再読み込みすること', async () => {
      const newProjectId = 'new-project-id';
      vi.mocked(getTaskBlocks).mockReturnValue([]);

      const { result, rerender } = renderHook(
        ({ projectId }) => useTaskBlocks(projectId),
        { initialProps: { projectId: mockProject.id } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(getTaskBlocks).toHaveBeenCalledWith(mockProject.id);

      // projectIdを変更
      rerender({ projectId: newProjectId });

      await waitFor(() => {
        expect(getTaskBlocks).toHaveBeenCalledWith(newProjectId);
      });
    });

    it('タスクブロック読み込みエラー時にローディングがfalseになること', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(getTaskBlocks).mockImplementation(() => {
        throw new Error('Loading failed');
      });

      const { result } = renderHook(() => useTaskBlocks(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.taskBlocks).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load task blocks:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('updateTaskBlock', () => {
    it('タスクブロックを更新できること', async () => {
      vi.mocked(getTaskBlocks)
        .mockReturnValueOnce(mockTaskBlocks)  // 初期読み込み
        .mockReturnValue(mockTaskBlocks);     // updateTaskBlock内での読み込み

      const { result } = renderHook(() => useTaskBlocks(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: boolean = false;
      await act(async () => {
        updateResult = await result.current.updateTaskBlock('task-1', { amount: 5 });
      });

      expect(updateResult).toBe(true);
      expect(saveTaskBlocks).toHaveBeenCalled();
      
      // ローカル状態が更新されることを確認
      const updatedBlock = result.current.taskBlocks.find(b => b.id === 'task-1');
      expect(updatedBlock?.amount).toBe(5);
    });

    it('存在しないタスクブロック更新時にfalseを返すこと', async () => {
      vi.mocked(getTaskBlocks)
        .mockReturnValueOnce(mockTaskBlocks)
        .mockReturnValue(mockTaskBlocks);

      const { result } = renderHook(() => useTaskBlocks(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: boolean = false;
      await act(async () => {
        updateResult = await result.current.updateTaskBlock('non-existent', { amount: 5 });
      });

      expect(updateResult).toBe(false);
      expect(saveTaskBlocks).not.toHaveBeenCalled();
    });

    it('更新エラー時にfalseを返すこと', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(getTaskBlocks)
        .mockReturnValueOnce(mockTaskBlocks)
        .mockReturnValue(mockTaskBlocks);
      vi.mocked(saveTaskBlocks).mockImplementationOnce(() => {
        throw new Error('Save failed');
      });

      const { result } = renderHook(() => useTaskBlocks(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: boolean = false;
      await act(async () => {
        updateResult = await result.current.updateTaskBlock('task-1', { amount: 5 });
      });

      expect(updateResult).toBe(false);
      
      consoleSpy.mockRestore();
    });
  });

  describe('moveTaskBlock', () => {
    it('タスクブロックを移動できること', async () => {
      vi.mocked(getTaskBlocks)
        .mockReturnValueOnce(mockTaskBlocks)
        .mockReturnValue(mockTaskBlocks);

      const { result } = renderHook(() => useTaskBlocks(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let moveResult: boolean = false;
      await act(async () => {
        moveResult = await result.current.moveTaskBlock('task-1', '2030-06-20');
      });

      expect(moveResult).toBe(true);
      expect(saveTaskBlocks).toHaveBeenCalled();
      
      // ローカル状態が更新されることを確認
      const movedBlock = result.current.taskBlocks.find(b => b.id === 'task-1');
      expect(movedBlock?.date).toBe('2030-06-20');
    });
  });

  describe('toggleTaskCompletion', () => {
    it('タスク完了状態を切り替えできること', async () => {
      vi.mocked(getTaskBlocks)
        .mockReturnValueOnce(mockTaskBlocks)
        .mockReturnValue(mockTaskBlocks);

      const { result } = renderHook(() => useTaskBlocks(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let toggleResult: boolean = false;
      await act(async () => {
        toggleResult = await result.current.toggleTaskCompletion('task-1', true);
      });

      expect(toggleResult).toBe(true);
      expect(saveTaskBlocks).toHaveBeenCalled();
      
      // ローカル状態が更新されることを確認
      const toggledBlock = result.current.taskBlocks.find(b => b.id === 'task-1');
      expect(toggledBlock?.completed).toBe(true);
    });
  });

  describe('フィルタリング・検索機能', () => {
    it('getTaskBlocksByDateが正しく動作すること', async () => {
      vi.mocked(getTaskBlocks).mockReturnValue(mockTaskBlocks);

      const { result } = renderHook(() => useTaskBlocks(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const blocksOnDate = result.current.getTaskBlocksByDate('2030-06-15');
      
      expect(blocksOnDate).toHaveLength(1);
      expect(blocksOnDate.every(block => block.date === '2030-06-15')).toBe(true);
    });

    it('getTaskBlocksByCategoryが正しく動作すること', async () => {
      vi.mocked(getTaskBlocks).mockReturnValue(mockTaskBlocks);

      const { result } = renderHook(() => useTaskBlocks(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const blocksInCategory = result.current.getTaskBlocksByCategory(mockCategory.id);
      
      expect(blocksInCategory).toHaveLength(2);
      expect(blocksInCategory.every(block => block.categoryId === mockCategory.id)).toBe(true);
    });
  });

  describe('進捗計算機能', () => {
    it('getProgressByCategoryが正しく進捗を計算すること', async () => {
      vi.mocked(getTaskBlocks).mockReturnValue(mockTaskBlocks);

      const { result } = renderHook(() => useTaskBlocks(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const progress = result.current.getProgressByCategory(mockCategory.id);
      
      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(2);
      expect(progress.percentage).toBe(100);
    });

    it('getOverallProgressが正しく全体進捗を計算すること', async () => {
      vi.mocked(getTaskBlocks).mockReturnValue(mockTaskBlocks);

      const { result } = renderHook(() => useTaskBlocks(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const progress = result.current.getOverallProgress();
      
      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(3);
      expect(progress.percentage).toBe(67);
    });

    it('タスクブロックが存在しない場合の進捗計算が正しいこと', async () => {
      vi.mocked(getTaskBlocks).mockReturnValue([]);

      const { result } = renderHook(() => useTaskBlocks(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const categoryProgress = result.current.getProgressByCategory('non-existent');
      const overallProgress = result.current.getOverallProgress();
      
      expect(categoryProgress.completed).toBe(0);
      expect(categoryProgress.total).toBe(0);
      expect(categoryProgress.percentage).toBe(0);
      
      expect(overallProgress.completed).toBe(0);
      expect(overallProgress.total).toBe(0);
      expect(overallProgress.percentage).toBe(0);
    });
  });

  describe('getDateRange', () => {
    it('日付範囲を正しく計算すること', async () => {
      vi.mocked(getTaskBlocks).mockReturnValue(mockTaskBlocks);

      const { result } = renderHook(() => useTaskBlocks(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const dateRange = result.current.getDateRange();
      
      expect(dateRange).not.toBeNull();
      expect(dateRange?.start).toEqual(new Date('2030-06-15'));
      expect(dateRange?.end).toEqual(new Date('2030-06-20'));
    });

    it('タスクブロックが存在しない場合にnullを返すこと', async () => {
      vi.mocked(getTaskBlocks).mockReturnValue([]);

      const { result } = renderHook(() => useTaskBlocks(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const dateRange = result.current.getDateRange();
      
      expect(dateRange).toBeNull();
    });
  });

  describe('refreshTaskBlocks', () => {
    it('タスクブロックを再読み込みできること', async () => {
      const initialBlocks = mockTaskBlocks.slice(0, 2);
      const updatedBlocks = mockTaskBlocks;
      
      vi.mocked(getTaskBlocks)
        .mockReturnValueOnce(initialBlocks)
        .mockReturnValueOnce(updatedBlocks);

      const { result } = renderHook(() => useTaskBlocks(mockProject.id));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.taskBlocks).toEqual(initialBlocks);

      await act(async () => {
        result.current.refreshTaskBlocks();
      });

      expect(result.current.taskBlocks).toEqual(updatedBlocks);
      expect(getTaskBlocks).toHaveBeenCalledTimes(2);
    });
  });
});