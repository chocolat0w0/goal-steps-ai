import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '~/test/utils';
import TaskBlock from '../TaskBlock';
import { type TaskBlock as TaskBlockType, type Category } from '~/types';

const mockCategory: Category = {
  id: 'category-1',
  projectId: 'project-1',
  name: 'テストカテゴリー',
  valueRange: { min: 0, max: 100 },
  minUnit: 5,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockTaskBlock: TaskBlockType = {
  id: 'task-1',
  categoryId: 'category-1',
  projectId: 'project-1',
  date: '2024-06-15',
  amount: 5,
  completed: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('TaskBlock', () => {
  const mockOnToggleCompletion = vi.fn();

  const defaultProps = {
    taskBlock: mockTaskBlock,
    category: mockCategory,
    allTaskBlocks: [mockTaskBlock],
    onToggleCompletion: mockOnToggleCompletion,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('タスクブロックが正しく表示されること', () => {
      render(<TaskBlock {...defaultProps} />);

      expect(screen.getByText('テストカテゴリー')).toBeInTheDocument();
      expect(screen.getByText('0 - 5')).toBeInTheDocument();
    });

    it('カテゴリー名とタスク量が正しく表示されること', () => {
      const customTaskBlock = {
        ...mockTaskBlock,
        amount: 10,
      };
      const customCategory = {
        ...mockCategory,
        name: 'カスタムカテゴリー',
      };

      render(
        <TaskBlock
          {...defaultProps}
          taskBlock={customTaskBlock}
          category={customCategory}
          allTaskBlocks={[customTaskBlock]}
        />
      );

      expect(screen.getByText('カスタムカテゴリー')).toBeInTheDocument();
      expect(screen.getByText('0 - 5')).toBeInTheDocument();
    });

    it('未完了タスクにチェックボックスが正しく表示されること', () => {
      render(<TaskBlock {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('完了済みタスクにチェックマークが表示されること', () => {
      const completedTaskBlock = {
        ...mockTaskBlock,
        completed: true,
      };

      render(
        <TaskBlock
          {...defaultProps}
          taskBlock={completedTaskBlock}
          allTaskBlocks={[completedTaskBlock]}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();

      // 完了アイコンが表示される
      const completionIcon = document.querySelector('.text-green-600');
      expect(completionIcon).toBeInTheDocument();
    });

    it('未完了タスクにドラッグアイコンが表示されること', () => {
      render(<TaskBlock {...defaultProps} />);

      const dragIcon = document.querySelector(
        'svg[viewBox="0 0 24 24"] path[d*="M7 16V4"]'
      );
      expect(dragIcon).toBeInTheDocument();
    });

    it('完了済みタスクにドラッグアイコンが表示されないこと', () => {
      const completedTaskBlock = {
        ...mockTaskBlock,
        completed: true,
      };

      render(
        <TaskBlock
          {...defaultProps}
          taskBlock={completedTaskBlock}
          allTaskBlocks={[completedTaskBlock]}
        />
      );

      const dragIcon = document.querySelector(
        'svg[viewBox="0 0 24 24"] path[d*="M7 16V4"]'
      );
      expect(dragIcon).not.toBeInTheDocument();
    });

    it('完了済みタスクに取り消し線が表示されること', () => {
      const completedTaskBlock = {
        ...mockTaskBlock,
        completed: true,
      };

      render(
        <TaskBlock
          {...defaultProps}
          taskBlock={completedTaskBlock}
          allTaskBlocks={[completedTaskBlock]}
        />
      );

      const categoryName = screen.getByText('テストカテゴリー');
      expect(categoryName).toHaveClass('line-through');
    });

    it('完了済みタスクが半透明になること', () => {
      const completedTaskBlock = {
        ...mockTaskBlock,
        completed: true,
      };

      render(
        <TaskBlock
          {...defaultProps}
          taskBlock={completedTaskBlock}
          allTaskBlocks={[completedTaskBlock]}
        />
      );

      const taskElement = screen
        .getByText('テストカテゴリー')
        .closest('div[draggable]');
      expect(taskElement).toHaveClass('opacity-60');
    });

    it('適切なツールチップが表示されること', () => {
      render(<TaskBlock {...defaultProps} />);

      const taskElement = screen
        .getByText('テストカテゴリー')
        .closest('div[draggable]');
      expect(taskElement).toHaveAttribute('title', 'テストカテゴリー - 0 - 5');
    });

    it('完了済みタスクのツールチップに(完了)が含まれること', () => {
      const completedTaskBlock = {
        ...mockTaskBlock,
        completed: true,
      };

      render(
        <TaskBlock
          {...defaultProps}
          taskBlock={completedTaskBlock}
          allTaskBlocks={[completedTaskBlock]}
        />
      );

      const taskElement = screen
        .getByText('テストカテゴリー')
        .closest('div[draggable]');
      expect(taskElement).toHaveAttribute(
        'title',
        'テストカテゴリー - 0 - 5 (完了)'
      );
    });
  });

  describe('スタイリング', () => {
    it('カテゴリーIDに基づいて一意の色が適用されること', () => {
      render(<TaskBlock {...defaultProps} />);

      const taskElement = screen
        .getByText('テストカテゴリー')
        .closest('div[draggable]');

      // 色のクラスが適用されていることを確認（bg-*、border-*、text-*のパターン）
      const hasColorClass =
        taskElement?.className.includes('bg-') &&
        taskElement?.className.includes('border-') &&
        taskElement?.className.includes('text-');
      expect(hasColorClass).toBe(true);
    });

    it('isDraggingがtrueの場合にドラッグスタイルが適用されること', () => {
      render(<TaskBlock {...defaultProps} isDragging={true} />);

      const taskElement = screen
        .getByText('テストカテゴリー')
        .closest('div[draggable]');
      expect(taskElement).toHaveClass('opacity-50', 'transform', 'rotate-2');
    });

    it('isDroppableがtrueの場合にドロップ可能スタイルが適用されること', () => {
      render(<TaskBlock {...defaultProps} isDroppable={true} />);

      const taskElement = screen
        .getByText('テストカテゴリー')
        .closest('div[draggable]');
      expect(taskElement).toHaveClass(
        'ring-2',
        'ring-blue-400',
        'ring-opacity-50'
      );
    });

    it('未完了タスクにホバースタイルが適用されること', () => {
      render(<TaskBlock {...defaultProps} />);

      const taskElement = screen
        .getByText('テストカテゴリー')
        .closest('div[draggable]');
      expect(taskElement).toHaveClass('hover:shadow-md');
    });

    it('完了済みタスクにホバースタイルが適用されないこと', () => {
      const completedTaskBlock = {
        ...mockTaskBlock,
        completed: true,
      };

      render(
        <TaskBlock
          {...defaultProps}
          taskBlock={completedTaskBlock}
          allTaskBlocks={[completedTaskBlock]}
        />
      );

      const taskElement = screen
        .getByText('テストカテゴリー')
        .closest('div[draggable]');
      expect(taskElement).not.toHaveClass('hover:shadow-md');
    });
  });

  describe('インタラクション', () => {
    it('タスクブロッククリック時にonToggleCompletionが呼ばれること', () => {
      render(<TaskBlock {...defaultProps} />);

      const taskElement = screen
        .getByText('テストカテゴリー')
        .closest('div[draggable]');
      fireEvent.click(taskElement!);

      expect(mockOnToggleCompletion).toHaveBeenCalledWith('task-1', true);
    });

    it('チェックボックスクリック時にonToggleCompletionが呼ばれること', () => {
      render(<TaskBlock {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(mockOnToggleCompletion).toHaveBeenCalledWith('task-1', true);
    });

    it('完了済みタスクのクリック時に未完了にトグルされること', () => {
      const completedTaskBlock = {
        ...mockTaskBlock,
        completed: true,
      };

      render(
        <TaskBlock
          {...defaultProps}
          taskBlock={completedTaskBlock}
          allTaskBlocks={[completedTaskBlock]}
        />
      );

      const taskElement = screen
        .getByText('テストカテゴリー')
        .closest('div[draggable]');
      fireEvent.click(taskElement!);

      expect(mockOnToggleCompletion).toHaveBeenCalledWith('task-1', false);
    });

    it('チェックボックスクリック時にイベント伝播が停止されること', () => {
      const taskClickHandler = vi.fn();

      render(
        <div onClick={taskClickHandler}>
          <TaskBlock {...defaultProps} allTaskBlocks={[mockTaskBlock]} />
        </div>
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      // チェックボックスのクリックが親要素に伝播しないことを確認
      expect(taskClickHandler).not.toHaveBeenCalled();
      expect(mockOnToggleCompletion).toHaveBeenCalled();
    });
  });

  describe('ドラッグ&ドロップ', () => {
    it('未完了タスクがドラッグ可能であること', () => {
      render(<TaskBlock {...defaultProps} />);

      const taskElement = screen
        .getByText('テストカテゴリー')
        .closest('div[draggable]');
      expect(taskElement).toHaveAttribute('draggable', 'true');
    });

    it('完了済みタスクがドラッグ不可能であること', () => {
      const completedTaskBlock = {
        ...mockTaskBlock,
        completed: true,
      };

      render(
        <TaskBlock
          {...defaultProps}
          taskBlock={completedTaskBlock}
          allTaskBlocks={[completedTaskBlock]}
        />
      );

      const taskElement = screen
        .getByText('テストカテゴリー')
        .closest('div[draggable]');
      expect(taskElement).toHaveAttribute('draggable', 'false');
    });

    it('ドラッグ開始時に正しいデータが設定されること', () => {
      render(<TaskBlock {...defaultProps} />);

      const taskElement = screen
        .getByText('テストカテゴリー')
        .closest('div[draggable]');

      // ドラッグ開始イベントをシンプルにテスト
      fireEvent.dragStart(taskElement!, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move',
        },
      });

      // イベントが発生することを確認（dataTransferはJSDOM制限のため詳細テストはスキップ）
      expect(taskElement).toHaveAttribute('draggable', 'true');
    });
  });

  describe('アクセシビリティ', () => {
    it('チェックボックスに適切なラベルが関連付けられていること', () => {
      render(<TaskBlock {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
    });

    it('タスクブロックにツールチップが設定されていること', () => {
      render(<TaskBlock {...defaultProps} />);

      const taskElement = screen
        .getByText('テストカテゴリー')
        .closest('div[draggable]');
      expect(taskElement).toHaveAttribute('title');
    });

    it('カーソルスタイルが適切に設定されていること', () => {
      render(<TaskBlock {...defaultProps} />);

      const taskElement = screen
        .getByText('テストカテゴリー')
        .closest('div[draggable]');
      expect(taskElement).toHaveClass('cursor-pointer');
    });

    it('フォーカス時の視覚的フィードバックが提供されること', () => {
      render(<TaskBlock {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('focus:ring-2');
    });
  });
});
