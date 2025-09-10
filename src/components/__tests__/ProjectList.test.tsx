import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '~/test/utils';
import ProjectList from '../ProjectList';
import { type Project } from '~/types';

const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'テストプロジェクト1',
    deadline: '2030-12-31',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'project-2',
    name: 'テストプロジェクト2',
    deadline: '2024-06-15',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'project-3',
    name: 'テストプロジェクト3',
    deadline: '2023-12-31', // 過去の日付
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
];

describe('ProjectList', () => {
  const mockOnEditProject = vi.fn();
  const mockOnDeleteProject = vi.fn();
  const mockOnSelectProject = vi.fn();

  const defaultProps = {
    projects: mockProjects,
    onEditProject: mockOnEditProject,
    onDeleteProject: mockOnDeleteProject,
    onSelectProject: mockOnSelectProject,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('プロジェクトリストが正しく表示されること', () => {
      render(<ProjectList {...defaultProps} />);

      expect(screen.getByText('テストプロジェクト1')).toBeInTheDocument();
      expect(screen.getByText('テストプロジェクト2')).toBeInTheDocument();
      expect(screen.getByText('テストプロジェクト3')).toBeInTheDocument();
    });

    it('プロジェクトが空の場合にメッセージが表示されること', () => {
      render(<ProjectList {...defaultProps} projects={[]} />);

      expect(screen.getByText('プロジェクトがありません')).toBeInTheDocument();
      expect(screen.getByText('新しいプロジェクトを作成して目標管理を始めましょう')).toBeInTheDocument();
    });

    it('期限情報が正しくフォーマットされて表示されること', () => {
      render(<ProjectList {...defaultProps} />);

      // 期限の表示形式をチェック
      expect(screen.getByText('2030年12月31日')).toBeInTheDocument();
      expect(screen.getByText('2024年6月15日')).toBeInTheDocument();
      expect(screen.getByText('2023年12月31日')).toBeInTheDocument();
    });

    it('期限までの残り日数が正しく計算されて表示されること', () => {
      render(<ProjectList {...defaultProps} />);

      // 過去の日付は「○日経過」として表示される
      expect(screen.getByText(/日経過/)).toBeInTheDocument();
      
      // 未来の日付は「残り○日」として表示される
      expect(screen.getByText(/残り.*日/)).toBeInTheDocument();
    });

    it('期限の色分けが正しく適用されること', () => {
      render(<ProjectList {...defaultProps} />);

      // 過去の期限は赤色
      const expiredProject = screen.getByText(/日経過/);
      expect(expiredProject).toHaveClass('text-red-600');
    });
  });

  describe('インタラクション', () => {
    it('プロジェクト名クリック時にonSelectProjectが呼ばれること', () => {
      render(<ProjectList {...defaultProps} />);

      fireEvent.click(screen.getByText('テストプロジェクト1'));

      expect(mockOnSelectProject).toHaveBeenCalledWith(mockProjects[0]);
    });

    it('プロジェクトを開くボタンクリック時にonSelectProjectが呼ばれること', () => {
      render(<ProjectList {...defaultProps} />);

      const openButtons = screen.getAllByText('プロジェクトを開く →');
      fireEvent.click(openButtons[0]);

      expect(mockOnSelectProject).toHaveBeenCalledWith(mockProjects[0]);
    });

    it('編集ボタンクリック時にonEditProjectが呼ばれること', () => {
      render(<ProjectList {...defaultProps} />);

      const editButtons = screen.getAllByTitle('編集');
      fireEvent.click(editButtons[0]);

      expect(mockOnEditProject).toHaveBeenCalledWith(mockProjects[0]);
    });

    it('削除ボタンクリック時に確認ダイアログが表示されること', () => {
      // window.confirmをモック
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<ProjectList {...defaultProps} />);

      const deleteButtons = screen.getAllByTitle('削除');
      fireEvent.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith(
        'このプロジェクトを削除しますか？関連するすべてのデータも削除されます。'
      );

      confirmSpy.mockRestore();
    });

    it('削除確認でOKした場合にonDeleteProjectが呼ばれること', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockOnDeleteProject.mockResolvedValue(true);

      render(<ProjectList {...defaultProps} />);

      const deleteButtons = screen.getAllByTitle('削除');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockOnDeleteProject).toHaveBeenCalledWith('project-1');
      });

      confirmSpy.mockRestore();
    });

    it('削除確認でキャンセルした場合にonDeleteProjectが呼ばれないこと', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<ProjectList {...defaultProps} />);

      const deleteButtons = screen.getAllByTitle('削除');
      fireEvent.click(deleteButtons[0]);

      expect(mockOnDeleteProject).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('削除失敗時にアラートが表示されること', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      mockOnDeleteProject.mockResolvedValue(false);

      render(<ProjectList {...defaultProps} />);

      const deleteButtons = screen.getAllByTitle('削除');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('プロジェクトの削除に失敗しました');
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
      mockOnDeleteProject.mockReturnValue(deletePromise);

      render(<ProjectList {...defaultProps} />);

      const deleteButtons = screen.getAllByTitle('削除');
      fireEvent.click(deleteButtons[0]);

      // ローディングスピナーが表示されることを確認
      expect(screen.getByRole('button', { name: /削除/ })).toBeDisabled();
      expect(screen.getByRole('button', { name: /削除/ }).querySelector('.animate-spin')).toBeInTheDocument();

      // 削除を完了
      resolveDelete!(true);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /削除/ })).not.toBeDisabled();
      });

      confirmSpy.mockRestore();
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なボタンロールが設定されていること', () => {
      render(<ProjectList {...defaultProps} />);

      const editButtons = screen.getAllByTitle('編集');
      const deleteButtons = screen.getAllByTitle('削除');
      const openButtons = screen.getAllByText('プロジェクトを開く →');

      editButtons.forEach(button => {
        expect(button).toHaveAttribute('title', '編集');
      });

      deleteButtons.forEach(button => {
        expect(button).toHaveAttribute('title', '削除');
      });

      openButtons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('プロジェクト名がクリッカブルであることが分かること', () => {
      render(<ProjectList {...defaultProps} />);

      const projectName = screen.getByText('テストプロジェクト1');
      expect(projectName).toHaveClass('cursor-pointer');
      expect(projectName).toHaveClass('hover:text-blue-600');
    });
  });
});