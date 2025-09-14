import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '~/test/utils';
import CalendarDay from '../CalendarDay';
import { type TaskBlock as TaskBlockType, type Category } from '~/types';

const mockCategories: Category[] = [
  {
    id: 'category-1',
    projectId: 'project-1',
    name: 'テストカテゴリー1',
    valueRange: { min: 0, max: 100 },
    minUnit: 5,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'category-2',
    projectId: 'project-1',
    name: 'テストカテゴリー2',
    valueRange: { min: 0, max: 50 },
    minUnit: 2,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

const mockTaskBlocks: TaskBlockType[] = [
  {
    id: 'task-1',
    categoryId: 'category-1',
    projectId: 'project-1',
    date: '2024-06-15',
    amount: 5,
    completed: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'task-2',
    categoryId: 'category-2',
    projectId: 'project-1',
    date: '2024-06-15',
    amount: 2,
    completed: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'task-3',
    categoryId: 'category-1',
    projectId: 'project-1',
    date: '2024-06-16', // 別の日付
    amount: 3,
    completed: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

describe('CalendarDay', () => {
  const mockOnToggleTaskCompletion = vi.fn();
  const mockOnMoveTaskBlock = vi.fn();
  const testDate = new Date('2024-06-15T00:00:00.000Z');

  const defaultProps = {
    date: testDate,
    taskBlocks: mockTaskBlocks,
    categories: mockCategories,
    allTaskBlocks: mockTaskBlocks,
    onToggleTaskCompletion: mockOnToggleTaskCompletion,
    onMoveTaskBlock: mockOnMoveTaskBlock,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('日付が正しく表示されること', () => {
      render(<CalendarDay {...defaultProps} />);

      const dayNumber = testDate.getDate().toString();
      expect(screen.getByText(dayNumber)).toBeInTheDocument();
    });

    it('該当日のタスクブロックのみが表示されること', () => {
      render(<CalendarDay {...defaultProps} />);

      // 6/15の2つのタスクが表示される
      expect(screen.getByText('テストカテゴリー1')).toBeInTheDocument();
      expect(screen.getByText('テストカテゴリー2')).toBeInTheDocument();
      
      // タスクブロック数は2つ
      const taskBlocks = screen.getAllByText(/単位/);
      expect(taskBlocks).toHaveLength(2);
    });

    it('タスクがない日で適切に表示されること', () => {
      const emptyDate = new Date('2024-06-20T00:00:00.000Z');
      
      render(
        <CalendarDay
          {...defaultProps}
          date={emptyDate}
        />
      );

      const dayNumber = emptyDate.getDate().toString();
      expect(screen.getByText(dayNumber)).toBeInTheDocument();
      expect(screen.queryByText('テストカテゴリー1')).not.toBeInTheDocument();
    });

    it('進捗情報が正しく表示されること', () => {
      render(<CalendarDay {...defaultProps} />);

      // 完了数/総数が表示される (1/2)
      expect(screen.getByText('1/2')).toBeInTheDocument();
    });

    it('進捗バーが正しく表示されること', () => {
      render(<CalendarDay {...defaultProps} />);

      const progressBar = document.querySelector('.bg-blue-600.h-1');
      expect(progressBar).toBeInTheDocument();
      // 50%の進捗（1完了/2総数）
      expect(progressBar).toHaveStyle({ width: '50%' });
    });

    it('すべてのタスクが完了している場合にチェックマークが表示されること', () => {
      const allCompletedTaskBlocks = mockTaskBlocks.map(task => ({
        ...task,
        completed: true,
      }));

      render(
        <CalendarDay
          {...defaultProps}
          taskBlocks={allCompletedTaskBlocks}
        />
      );

      const completionIcon = document.querySelector('.text-green-600');
      expect(completionIcon).toBeInTheDocument();
    });

    it('一部のタスクが完了している場合にチェックマークが表示されないこと', () => {
      render(<CalendarDay {...defaultProps} />);

      const completionIcon = document.querySelector('.text-green-600');
      expect(completionIcon).not.toBeInTheDocument();
    });

    it('今日の場合に特別なスタイルが適用されること', () => {
      render(<CalendarDay {...defaultProps} isToday={true} />);

      const dayNumber = testDate.getDate().toString();
      const dayElement = screen.getByText(dayNumber).closest('div');
      expect(dayElement).toHaveClass('bg-blue-50', 'border-blue-300');

      // 今日マーカーが表示される
      const todayMarker = document.querySelector('.bg-blue-600.rounded-full');
      expect(todayMarker).toBeInTheDocument();

      // 日付文字色が青くなる
      const dateElement = screen.getByText(dayNumber);
      expect(dateElement).toHaveClass('text-blue-600');
    });

    it('当月以外の日付で特別なスタイルが適用されること', () => {
      render(<CalendarDay {...defaultProps} isCurrentMonth={false} />);

      const dayNumber = testDate.getDate().toString();
      const dayElement = screen.getByText(dayNumber).closest('div');
      expect(dayElement).toHaveClass('bg-gray-50', 'text-gray-400');
    });

    it('タスクがない日で進捗情報が表示されないこと', () => {
      const emptyDate = new Date('2024-06-20');
      
      render(
        <CalendarDay
          {...defaultProps}
          date={emptyDate}
        />
      );

      expect(screen.queryByText(/\/\d/)).not.toBeInTheDocument();
      expect(document.querySelector('.bg-blue-600.h-1')).not.toBeInTheDocument();
    });
  });

  describe('ドラッグ&ドロップ', () => {
    it('ドラッグオーバー時にスタイルが変更されること', () => {
      render(<CalendarDay {...defaultProps} />);

      const dayNumber = testDate.getDate().toString();
      const dayElement = screen.getByText(dayNumber).closest('div');

      fireEvent.dragOver(dayElement!, {
        dataTransfer: { dropEffect: 'move' },
      });

      expect(dayElement).toHaveClass('bg-green-50', 'border-green-400', 'border-dashed');
    });

    it('ドラッグリーブ時にスタイルが元に戻ること', () => {
      render(<CalendarDay {...defaultProps} />);

      const dayNumber = testDate.getDate().toString();
      const dayElement = screen.getByText(dayNumber).closest('div');

      fireEvent.dragOver(dayElement!);
      expect(dayElement).toHaveClass('bg-green-50');

      fireEvent.dragLeave(dayElement!);
      expect(dayElement).not.toHaveClass('bg-green-50');
    });

    it('ドロップ時にonMoveTaskBlockが呼ばれること', () => {
      render(<CalendarDay {...defaultProps} />);

      const dayNumber = testDate.getDate().toString();
      const dayElement = screen.getByText(dayNumber).closest('div');
      const dropData = JSON.stringify({
        blockId: 'task-1',
        categoryId: 'category-1',
        originalDate: '2024-06-14', // 異なる日付
      });

      fireEvent.drop(dayElement!, {
        dataTransfer: {
          getData: () => dropData,
        },
      });

      expect(mockOnMoveTaskBlock).toHaveBeenCalledWith('task-1', '2024-06-15');
    });

    it('同じ日付にドロップした場合にonMoveTaskBlockが呼ばれないこと', () => {
      render(<CalendarDay {...defaultProps} />);

      const dayNumber = testDate.getDate().toString();
      const dayElement = screen.getByText(dayNumber).closest('div');
      const dropData = JSON.stringify({
        blockId: 'task-1',
        categoryId: 'category-1',
        originalDate: '2024-06-15', // 同じ日付
      });

      fireEvent.drop(dayElement!, {
        dataTransfer: {
          getData: () => dropData,
        },
      });

      expect(mockOnMoveTaskBlock).not.toHaveBeenCalled();
    });

    it('無効なドロップデータの場合にエラーが処理されること', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<CalendarDay {...defaultProps} />);

      const dayNumber = testDate.getDate().toString();
      const dayElement = screen.getByText(dayNumber).closest('div');

      fireEvent.drop(dayElement!, {
        dataTransfer: {
          getData: () => 'invalid json',
        },
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse drag data:', expect.any(Error));
      expect(mockOnMoveTaskBlock).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('空の日にドラッグオーバー時にメッセージが表示されること', () => {
      const emptyDate = new Date('2024-06-20');
      
      render(
        <CalendarDay
          {...defaultProps}
          date={emptyDate}
        />
      );

      const dayNumber = emptyDate.getDate().toString();
      const dayElement = screen.getByText(dayNumber).closest('div');
      fireEvent.dragOver(dayElement!);

      expect(screen.getByText('ここに移動')).toBeInTheDocument();
    });

    it('タスクがある日にドラッグオーバー時にメッセージが表示されないこと', () => {
      render(<CalendarDay {...defaultProps} />);

      const dayNumber = testDate.getDate().toString();
      const dayElement = screen.getByText(dayNumber).closest('div');
      fireEvent.dragOver(dayElement!);

      expect(screen.queryByText('ここに移動')).not.toBeInTheDocument();
    });
  });

  describe('タスクブロック操作', () => {
    it('タスクブロックのクリック時にonToggleTaskCompletionが呼ばれること', () => {
      render(<CalendarDay {...defaultProps} />);

      const taskBlock = screen.getByText('テストカテゴリー1').closest('div[draggable]');
      fireEvent.click(taskBlock!);

      expect(mockOnToggleTaskCompletion).toHaveBeenCalledWith('task-1', true);
    });

    it('存在しないカテゴリーのタスクブロックが表示されないこと', () => {
      const taskBlocksWithInvalidCategory = [
        ...mockTaskBlocks,
        {
          id: 'task-invalid',
          categoryId: 'non-existent-category',
          projectId: 'project-1',
          date: '2024-06-15',
          amount: 1,
          completed: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      render(
        <CalendarDay
          {...defaultProps}
          taskBlocks={taskBlocksWithInvalidCategory}
        />
      );

      // 有効なカテゴリーのタスクのみ表示される
      const taskBlocks = screen.getAllByText(/単位/);
      expect(taskBlocks).toHaveLength(2); // 無効なカテゴリーのタスクは表示されない
    });
  });

  describe('進捗計算', () => {
    it('進捗パーセンテージが正しく計算されること', () => {
      render(<CalendarDay {...defaultProps} />);

      const progressBar = document.querySelector('.bg-blue-600.h-1');
      expect(progressBar).toHaveStyle({ width: '50%' }); // 1完了/2総数 = 50%
    });

    it('すべて完了時に100%になること', () => {
      const allCompletedTaskBlocks = mockTaskBlocks.map(task => ({
        ...task,
        completed: true,
      }));

      render(
        <CalendarDay
          {...defaultProps}
          taskBlocks={allCompletedTaskBlocks}
        />
      );

      const progressBar = document.querySelector('.bg-blue-600.h-1');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('未完了時に0%になること', () => {
      const allIncompleteTaskBlocks = mockTaskBlocks.map(task => ({
        ...task,
        completed: false,
      }));

      render(
        <CalendarDay
          {...defaultProps}
          taskBlocks={allIncompleteTaskBlocks}
        />
      );

      const progressBar = document.querySelector('.bg-blue-600.h-1');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });
  });

  describe('アクセシビリティ', () => {
    it('日付が適切にマークアップされていること', () => {
      render(<CalendarDay {...defaultProps} />);

      const dateElement = screen.getByText('15');
      expect(dateElement).toHaveClass('text-sm', 'font-medium');
    });

    it('進捗情報が読み取りやすく表示されていること', () => {
      render(<CalendarDay {...defaultProps} />);

      const progressText = screen.getByText('1/2');
      expect(progressText).toHaveClass('text-xs');
    });

    it('ドラッグ操作の視覚的フィードバックが提供されていること', () => {
      render(<CalendarDay {...defaultProps} />);

      const dayNumber = testDate.getDate().toString();
      const dayElement = screen.getByText(dayNumber).closest('div');
      fireEvent.dragOver(dayElement!);

      expect(dayElement).toHaveClass('border-dashed');
    });

    it('スクロールエリアが適切に制限されていること', () => {
      render(<CalendarDay {...defaultProps} />);

      const scrollArea = document.querySelector('.max-h-24.overflow-y-auto');
      expect(scrollArea).toBeInTheDocument();
    });
  });
});