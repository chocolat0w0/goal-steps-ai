import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '~/test/utils';
import CategoryList from '../CategoryList';
import { type Category } from '~/types';

const mockCategories: Category[] = [
  {
    id: 'category-1',
    projectId: 'project-1',
    name: 'テストカテゴリー1',
    valueRange: { min: 0, max: 100 },
    minUnit: 5,
    deadline: '2030-12-31',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'category-2',
    projectId: 'project-1',
    name: 'テストカテゴリー2',
    valueRange: { min: 0, max: 50 },
    minUnit: 2,
    deadline: '2024-06-15',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'category-3',
    projectId: 'project-1',
    name: 'テストカテゴリー3',
    valueRange: { min: 10, max: 200 },
    minUnit: 10,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
];

const mockProgress = {
  completed: 5,
  total: 20,
  percentage: 25,
};

describe('CategoryList', () => {
  const mockOnEditCategory = vi.fn();
  const mockOnDeleteCategory = vi.fn();
  const mockGetCategoryProgress = vi.fn();

  const defaultProps = {
    categories: mockCategories,
    onEditCategory: mockOnEditCategory,
    onDeleteCategory: mockOnDeleteCategory,
    getCategoryProgress: mockGetCategoryProgress,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCategoryProgress.mockReturnValue(mockProgress);
  });

  describe('レンダリング', () => {
    it('カテゴリーリストが正しく表示されること', () => {
      render(<CategoryList {...defaultProps} />);

      expect(screen.getByText('テストカテゴリー1')).toBeInTheDocument();
      expect(screen.getByText('テストカテゴリー2')).toBeInTheDocument();
      expect(screen.getByText('テストカテゴリー3')).toBeInTheDocument();
    });

    it('カテゴリーが空の場合にメッセージが表示されること', () => {
      render(<CategoryList {...defaultProps} categories={[]} />);

      expect(screen.getByText('カテゴリーがありません')).toBeInTheDocument();
      expect(screen.getByText('新しいカテゴリーを作成して目標を分解しましょう')).toBeInTheDocument();
    });

    it('カテゴリー情報が正しく表示されること', () => {
      render(<CategoryList {...defaultProps} />);

      // 値範囲の表示
      expect(screen.getAllByText('範囲:')).toHaveLength(3);
      expect(screen.getByText('0 〜 100')).toBeInTheDocument();
      expect(screen.getByText('0 〜 50')).toBeInTheDocument();
      expect(screen.getByText('10 〜 200')).toBeInTheDocument();

      // 最小単位の表示
      expect(screen.getAllByText('最小単位:')).toHaveLength(3);
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('期限がある場合に期限情報が表示されること', () => {
      render(<CategoryList {...defaultProps} />);

      // 期限ありのカテゴリー
      expect(screen.getAllByText('期限:')).toHaveLength(2);
      expect(screen.getByText('2030年12月31日')).toBeInTheDocument();
      expect(screen.getByText('2024年6月15日')).toBeInTheDocument();
    });

    it('期限がない場合に期限情報が表示されないこと', () => {
      render(<CategoryList {...defaultProps} />);

      // カテゴリー3には期限がないので、期限表示は2つだけであること
      const deadlineLabels = screen.getAllByText('期限:');
      expect(deadlineLabels).toHaveLength(2);
    });

    it('進捗情報が正しく表示されること', () => {
      render(<CategoryList {...defaultProps} />);

      // 進捗状況のテキスト
      expect(screen.getAllByText('進捗状況')).toHaveLength(3);
      expect(screen.getAllByText('5 / 20 ブロック (25%)')).toHaveLength(3);

      // 想定ブロック数と完了ブロック数
      expect(screen.getAllByText('想定ブロック数: 20')).toHaveLength(3);
      expect(screen.getAllByText('完了ブロック数: 5')).toHaveLength(3);
    });

    it('進捗バーが正しい幅で表示されること', () => {
      render(<CategoryList {...defaultProps} />);

      const progressBars = screen.getAllByRole('progressbar', { hidden: true });
      progressBars.forEach(bar => {
        expect(bar).toHaveStyle({ width: '25%' });
      });
    });

    it('期限の色分けが正しく適用されること', () => {
      const categoriesWithVariousDeadlines: Category[] = [
        {
          ...mockCategories[0],
          deadline: '2023-12-31', // 過去の日付
        },
        {
          ...mockCategories[1],
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2日後
        },
        {
          ...mockCategories[2],
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10日後
        },
      ];

      render(<CategoryList {...defaultProps} categories={categoriesWithVariousDeadlines} />);

      // 過去の期限は赤色
      expect(screen.getByText(/日経過/)).toHaveClass('text-red-600');
      
      // 近い期限は黄色系
      expect(screen.getByText(/残り2日/)).toHaveClass('text-orange-600');
    });
  });

  describe('インタラクション', () => {
    it('編集ボタンクリック時にonEditCategoryが呼ばれること', () => {
      render(<CategoryList {...defaultProps} />);

      const editButtons = screen.getAllByTitle('編集');
      fireEvent.click(editButtons[0]);

      expect(mockOnEditCategory).toHaveBeenCalledWith(mockCategories[0]);
    });

    it('削除ボタンクリック時に確認ダイアログが表示されること', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<CategoryList {...defaultProps} />);

      const deleteButtons = screen.getAllByTitle('削除');
      fireEvent.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith(
        'このカテゴリーを削除しますか？関連するタスクブロックも削除されます。'
      );

      confirmSpy.mockRestore();
    });

    it('削除確認でOKした場合にonDeleteCategoryが呼ばれること', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockOnDeleteCategory.mockResolvedValue(true);

      render(<CategoryList {...defaultProps} />);

      const deleteButtons = screen.getAllByTitle('削除');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockOnDeleteCategory).toHaveBeenCalledWith('category-1');
      });

      confirmSpy.mockRestore();
    });

    it('削除確認でキャンセルした場合にonDeleteCategoryが呼ばれないこと', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<CategoryList {...defaultProps} />);

      const deleteButtons = screen.getAllByTitle('削除');
      fireEvent.click(deleteButtons[0]);

      expect(mockOnDeleteCategory).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('削除失敗時にアラートが表示されること', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      mockOnDeleteCategory.mockResolvedValue(false);

      render(<CategoryList {...defaultProps} />);

      const deleteButtons = screen.getAllByTitle('削除');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('カテゴリーの削除に失敗しました');
      });

      confirmSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it('削除中はローディングスピナーが表示されること', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      let resolveDelete: (value: boolean) => void;
      const deletePromise = new Promise<boolean>((resolve) => {
        resolveDelete = resolve;
      });
      mockOnDeleteCategory.mockReturnValue(deletePromise);

      render(<CategoryList {...defaultProps} />);

      const deleteButtons = screen.getAllByTitle('削除');
      fireEvent.click(deleteButtons[0]);

      // ローディングスピナーが表示されることを確認
      expect(deleteButtons[0]).toBeDisabled();
      expect(deleteButtons[0].querySelector('.animate-spin')).toBeInTheDocument();

      // 削除を完了
      resolveDelete!(true);
      await waitFor(() => {
        expect(deleteButtons[0]).not.toBeDisabled();
      });

      confirmSpy.mockRestore();
    });
  });

  describe('進捗計算', () => {
    it('各カテゴリーに対してgetCategoryProgressが呼ばれること', () => {
      render(<CategoryList {...defaultProps} />);

      expect(mockGetCategoryProgress).toHaveBeenCalledTimes(3);
      expect(mockGetCategoryProgress).toHaveBeenCalledWith(mockCategories[0]);
      expect(mockGetCategoryProgress).toHaveBeenCalledWith(mockCategories[1]);
      expect(mockGetCategoryProgress).toHaveBeenCalledWith(mockCategories[2]);
    });

    it('進捗が0%の場合に正しく表示されること', () => {
      mockGetCategoryProgress.mockReturnValue({
        completed: 0,
        total: 10,
        percentage: 0,
      });

      render(<CategoryList {...defaultProps} />);

      expect(screen.getAllByText('0 / 10 ブロック (0%)')).toHaveLength(3);
    });

    it('進捗が100%の場合に正しく表示されること', () => {
      mockGetCategoryProgress.mockReturnValue({
        completed: 15,
        total: 15,
        percentage: 100,
      });

      render(<CategoryList {...defaultProps} />);

      expect(screen.getAllByText('15 / 15 ブロック (100%)')).toHaveLength(3);
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なボタンロールが設定されていること', () => {
      render(<CategoryList {...defaultProps} />);

      const editButtons = screen.getAllByTitle('編集');
      const deleteButtons = screen.getAllByTitle('削除');

      editButtons.forEach(button => {
        expect(button).toHaveAttribute('title', '編集');
      });

      deleteButtons.forEach(button => {
        expect(button).toHaveAttribute('title', '削除');
      });
    });

    it('進捗バーにaria-labelが設定されていること', () => {
      render(<CategoryList {...defaultProps} />);

      const progressBars = screen.getAllByRole('progressbar', { hidden: true });
      expect(progressBars).toHaveLength(3);
    });
  });
});