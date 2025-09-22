import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '~/test/utils';
import App from '~/app/App';
import { type Project } from '~/types';

// localStorage をモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('基本フローインテグレーション', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();

    // デフォルトでは空のデータから開始
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('初回利用者の基本フロー', () => {
    it('アプリケーションが正常に起動し、初期画面が表示されること', async () => {
      render(<App />);

      // アプリケーションのタイトルが表示される
      await waitFor(() => {
        expect(screen.getByText('Goal Steps')).toBeInTheDocument();
      });

      // プロジェクト見出しが表示される
      expect(
        screen.getByRole('heading', { name: 'プロジェクト' })
      ).toBeInTheDocument();

      // 説明文が表示される
      expect(
        screen.getByText('目標達成に向けたプロジェクトを管理しましょう')
      ).toBeInTheDocument();

      // 初期状態では空のメッセージが表示される
      expect(screen.getByText('プロジェクトがありません')).toBeInTheDocument();
      expect(
        screen.getByText('新しいプロジェクトを作成して目標管理を始めましょう')
      ).toBeInTheDocument();

      // プロジェクト作成ボタンが表示される
      expect(
        screen.getByRole('button', { name: '新規プロジェクト' })
      ).toBeInTheDocument();
    });

    it('プロジェクト作成フォームが正常に開くこと', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Goal Steps')).toBeInTheDocument();
      });

      // プロジェクト作成ボタンをクリック
      const createButton = screen.getByRole('button', {
        name: '新規プロジェクト',
      });
      fireEvent.click(createButton);

      // プロジェクト作成モーダルが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('新規プロジェクト作成')).toBeInTheDocument();
      });

      // フォーム要素が表示される
      expect(screen.getByLabelText('プロジェクト名')).toBeInTheDocument();
      expect(screen.getByLabelText('目標期限')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '作成' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'キャンセル' })
      ).toBeInTheDocument();
    });

    it('プロジェクト作成が正常に動作し、詳細画面への遷移ができること', async () => {
      // localStorageのセットアップを改善
      let savedProjects: Project[] = [];
      localStorageMock.setItem.mockImplementation((key: string, value: string) => {
        if (key === 'goal-steps-projects') {
          savedProjects = JSON.parse(value);
        }
      });

      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'goal-steps-projects') {
          return JSON.stringify(savedProjects);
        }
        if (key.startsWith('goal-steps-categories-')) {
          return JSON.stringify([]);
        }
        if (key.startsWith('goal-steps-weekly-')) {
          return null;
        }
        return null;
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Goal Steps')).toBeInTheDocument();
      });

      // プロジェクト作成ボタンをクリック
      const createButton = screen.getByRole('button', {
        name: '新規プロジェクト',
      });
      fireEvent.click(createButton);

      // プロジェクト作成モーダルが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('新規プロジェクト作成')).toBeInTheDocument();
      });

      // フォーム入力（未来の日付を使用）
      const nameInput = screen.getByLabelText('プロジェクト名');
      const deadlineInput = screen.getByLabelText('目標期限');

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];

      fireEvent.change(nameInput, { target: { value: 'テストプロジェクト' } });
      fireEvent.change(deadlineInput, { target: { value: futureDateString } });

      // 作成ボタンをクリック
      const submitButton = screen.getByRole('button', { name: '作成' });
      fireEvent.click(submitButton);

      // モーダルが閉じられることを確認
      await waitFor(
        () => {
          expect(
            screen.queryByText('新規プロジェクト作成')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // プロジェクトが作成され、一覧に表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('テストプロジェクト')).toBeInTheDocument();
      });

      // localStorageに保存されることを確認
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'goal-steps-projects',
        expect.stringContaining('テストプロジェクト')
      );

      // プロジェクトカードをクリックして詳細画面に遷移
      const projectCard = screen.getByText('テストプロジェクト');
      fireEvent.click(projectCard);

      // プロジェクト詳細画面が表示されることを確認
      await waitFor(
        () => {
          expect(screen.getByText('プロジェクト一覧に戻る')).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // プロジェクト名が詳細画面に表示される - より柔軟な方法で確認
      await waitFor(
        () => {
          expect(screen.getByText('テストプロジェクト')).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // 初期状態ではカテゴリーがない
      expect(screen.getByText('カテゴリーがありません')).toBeInTheDocument();
      expect(
        screen.getByText('新しいカテゴリーを作成して目標を分解しましょう')
      ).toBeInTheDocument();

      // カテゴリー追加ボタンが表示される
      expect(
        screen.getByRole('button', { name: 'カテゴリー追加' })
      ).toBeInTheDocument();
    });

    it('プロジェクト詳細から一覧への戻りが正常に動作すること', async () => {
      // プロジェクトが存在する状態を設定
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];

      const mockProject = {
        id: 'project-1',
        name: 'テストプロジェクト',
        deadline: futureDateString,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'goal-steps-projects') {
          return JSON.stringify([mockProject]);
        }
        if (key.startsWith('goal-steps-categories-')) {
          return JSON.stringify([]);
        }
        return null;
      });

      render(<App />);

      // プロジェクトが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('テストプロジェクト')).toBeInTheDocument();
      });

      // プロジェクトをクリックして詳細画面へ
      const projectCard = screen.getByText('テストプロジェクト');
      fireEvent.click(projectCard);

      // プロジェクト詳細画面に移動
      await waitFor(() => {
        expect(screen.getByText('プロジェクト一覧に戻る')).toBeInTheDocument();
      });

      // 戻るボタンをクリック
      const backButton = screen.getByText('プロジェクト一覧に戻る');
      fireEvent.click(backButton);

      // プロジェクト一覧画面に戻ることを確認
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'プロジェクト' })
        ).toBeInTheDocument();
      });

      // プロジェクトカードが再表示される
      expect(screen.getByText('テストプロジェクト')).toBeInTheDocument();
    });
  });

  describe('基本的なナビゲーション', () => {
    it('ヘッダーナビゲーションが正常に表示されること', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Goal Steps')).toBeInTheDocument();
      });

      // ナビゲーションリンクが表示される（複数の「プロジェクト」があるのでAllByを使用）
      const projectLinks = screen.getAllByText('プロジェクト');
      expect(projectLinks.length).toBeGreaterThan(0);

      expect(screen.getByText('カレンダー')).toBeInTheDocument();
      expect(screen.getByText('設定')).toBeInTheDocument();
    });
  });

  describe('基本的なエラーハンドリング', () => {
    it('不正なデータがlocalStorageにある場合でもクラッシュしないこと', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      // 不正なJSONデータを設定
      localStorageMock.getItem.mockReturnValue('invalid json');

      render(<App />);

      // エラーが発生してもアプリケーションは動作する
      await waitFor(() => {
        expect(screen.getByText('Goal Steps')).toBeInTheDocument();
      });

      // 初期状態として空のメッセージが表示される
      expect(screen.getByText('プロジェクトがありません')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });
});
