import { useState, useEffect, useCallback } from 'react';
import { type TaskBlock } from '~/types';
import { getTaskBlocks, saveTaskBlocks } from '~/lib/storage';

export function useTaskBlocks(projectId: string) {
  const [taskBlocks, setTaskBlocks] = useState<TaskBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTaskBlocks = useCallback(() => {
    try {
      const blocks = getTaskBlocks(projectId);
      setTaskBlocks(blocks);
    } catch (error) {
      console.error('Failed to load task blocks:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadTaskBlocks();
  }, [loadTaskBlocks]);

  const updateTaskBlock = (
    blockId: string,
    updates: Partial<TaskBlock>
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const allBlocks = getTaskBlocks();
        const blockIndex = allBlocks.findIndex((b) => b.id === blockId);

        if (blockIndex === -1) {
          resolve(false);
          return;
        }

        const updatedBlock = {
          ...allBlocks[blockIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        allBlocks[blockIndex] = updatedBlock;
        saveTaskBlocks(allBlocks);

        setTaskBlocks((prev) =>
          prev.map((b) => (b.id === blockId ? updatedBlock : b))
        );

        resolve(true);
      } catch (error) {
        console.error('Failed to update task block:', error);
        resolve(false);
      }
    });
  };

  const moveTaskBlock = (
    blockId: string,
    newDate: string
  ): Promise<boolean> => {
    return updateTaskBlock(blockId, { date: newDate });
  };

  const toggleTaskCompletion = (
    blockId: string,
    completed: boolean
  ): Promise<boolean> => {
    return updateTaskBlock(blockId, { completed });
  };

  const getTaskBlocksByDate = (date: string): TaskBlock[] => {
    return taskBlocks.filter((block) => block.date === date);
  };

  const getTaskBlocksByCategory = (categoryId: string): TaskBlock[] => {
    return taskBlocks.filter((block) => block.categoryId === categoryId);
  };

  const getProgressByCategory = (
    categoryId: string
  ): { completed: number; total: number; percentage: number } => {
    const categoryBlocks = getTaskBlocksByCategory(categoryId);
    const completed = categoryBlocks.filter((block) => block.completed).length;
    const total = categoryBlocks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  };

  const getOverallProgress = (): {
    completed: number;
    total: number;
    percentage: number;
  } => {
    const completed = taskBlocks.filter((block) => block.completed).length;
    const total = taskBlocks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  };

  const getDateRange = (): { start: Date; end: Date } | null => {
    if (taskBlocks.length === 0) return null;

    const dates = taskBlocks.map((block) => new Date(block.date));
    const start = new Date(Math.min(...dates.map((d) => d.getTime())));
    const end = new Date(Math.max(...dates.map((d) => d.getTime())));

    return { start, end };
  };

  return {
    taskBlocks,
    loading,
    loadTaskBlocks,
    updateTaskBlock,
    moveTaskBlock,
    toggleTaskCompletion,
    getTaskBlocksByDate,
    getTaskBlocksByCategory,
    getProgressByCategory,
    getOverallProgress,
    getDateRange,
    refreshTaskBlocks: loadTaskBlocks,
  };
}
