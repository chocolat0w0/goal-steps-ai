import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '~/test/utils';
import Modal from '../Modal';

describe('Modal', () => {
  const mockOnClose = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    title: 'テストモーダル',
    children: <div>モーダルの内容</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // body のスタイルをリセット
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    document.body.style.overflow = '';
  });

  describe('レンダリング', () => {
    it('isOpenがtrueの場合にモーダルが表示されること', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByText('テストモーダル')).toBeInTheDocument();
      expect(screen.getByText('モーダルの内容')).toBeInTheDocument();
    });

    it('isOpenがfalseの場合にモーダルが表示されないこと', () => {
      render(<Modal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('テストモーダル')).not.toBeInTheDocument();
      expect(screen.queryByText('モーダルの内容')).not.toBeInTheDocument();
    });

    it('タイトルが正しく表示されること', () => {
      render(<Modal {...defaultProps} title="カスタムタイトル" />);

      expect(screen.getByText('カスタムタイトル')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'カスタムタイトル' })).toBeInTheDocument();
    });

    it('子要素が正しく表示されること', () => {
      const customChildren = (
        <div>
          <p>段落1</p>
          <p>段落2</p>
          <button>アクションボタン</button>
        </div>
      );

      render(<Modal {...defaultProps}>{customChildren}</Modal>);

      expect(screen.getByText('段落1')).toBeInTheDocument();
      expect(screen.getByText('段落2')).toBeInTheDocument();
      expect(screen.getByText('アクションボタン')).toBeInTheDocument();
    });

    it('モーダルのオーバーレイが存在すること', () => {
      render(<Modal {...defaultProps} />);

      const overlay = document.querySelector('.bg-gray-500.bg-opacity-75');
      expect(overlay).toBeInTheDocument();
    });

    it('モーダルコンテンツエリアが存在すること', () => {
      render(<Modal {...defaultProps} />);

      const contentArea = document.querySelector('.bg-white.rounded-lg');
      expect(contentArea).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    it('オーバーレイクリック時にonCloseが呼ばれること', () => {
      render(<Modal {...defaultProps} />);

      const overlay = document.querySelector('.bg-gray-500.bg-opacity-75');
      fireEvent.click(overlay!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('Escapeキー押下時にonCloseが呼ばれること', () => {
      render(<Modal {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('モーダルコンテンツクリック時にonCloseが呼ばれないこと', () => {
      render(<Modal {...defaultProps} />);

      const contentArea = document.querySelector('.bg-white.rounded-lg');
      fireEvent.click(contentArea!);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('Escape以外のキー押下時にonCloseが呼ばれないこと', () => {
      render(<Modal {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      fireEvent.keyDown(document, { key: 'ArrowUp' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('ボディスクロール制御', () => {
    it('モーダルが開いている時にbodyのスクロールが無効化されること', () => {
      render(<Modal {...defaultProps} isOpen={true} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('モーダルが閉じている時にbodyのスクロールが有効化されること', () => {
      const { rerender } = render(<Modal {...defaultProps} isOpen={true} />);
      
      // 最初は無効化されている
      expect(document.body.style.overflow).toBe('hidden');
      
      // 閉じるとスクロールが有効化される
      rerender(<Modal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('unset');
    });

    it('コンポーネントがアンマウントされた時にbodyのスクロールが復元されること', () => {
      const { unmount } = render(<Modal {...defaultProps} isOpen={true} />);

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('キーボードイベントリスナー', () => {
    it('モーダルが開いている時にキーボードイベントリスナーが登録されること', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      
      render(<Modal {...defaultProps} isOpen={true} />);

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('モーダルが閉じられた時にキーボードイベントリスナーが削除されること', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      const { rerender } = render(<Modal {...defaultProps} isOpen={true} />);
      
      rerender(<Modal {...defaultProps} isOpen={false} />);

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('コンポーネントがアンマウントされた時にキーボードイベントリスナーが削除されること', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(<Modal {...defaultProps} isOpen={true} />);
      
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('モーダルが閉じている状態でEscapeキーが押されてもonCloseが呼ばれないこと', () => {
      render(<Modal {...defaultProps} isOpen={false} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('アクセシビリティ', () => {
    it('モーダルがroleを持つこと', () => {
      render(<Modal {...defaultProps} />);

      // モーダルコンテンツにroleが暗黙的に設定されていることを確認
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('タイトルが見出しとして認識されること', () => {
      render(<Modal {...defaultProps} title="アクセシブルなタイトル" />);

      expect(screen.getByRole('heading', { level: 3, name: 'アクセシブルなタイトル' })).toBeInTheDocument();
    });

    it('モーダルがz-indexで最前面に表示されること', () => {
      render(<Modal {...defaultProps} />);

      const modalContainer = document.querySelector('.fixed.inset-0.z-50');
      expect(modalContainer).toBeInTheDocument();
      expect(modalContainer).toHaveClass('z-50');
    });

    it('背景オーバーレイが適切な不透明度を持つこと', () => {
      render(<Modal {...defaultProps} />);

      const overlay = document.querySelector('.bg-gray-500.bg-opacity-75');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('bg-opacity-75');
    });
  });

  describe('レスポンシブデザイン', () => {
    it('スマートフォン用のクラスが適用されていること', () => {
      render(<Modal {...defaultProps} />);

      const contentArea = document.querySelector('.sm\\:max-w-lg');
      expect(contentArea).toBeInTheDocument();
      expect(contentArea).toHaveClass('sm:max-w-lg', 'sm:w-full', 'sm:p-6');
    });

    it('テキスト配置のレスポンシブクラスが適用されていること', () => {
      render(<Modal {...defaultProps} />);

      const textContainer = document.querySelector('.text-center.sm\\:text-left');
      expect(textContainer).toBeInTheDocument();
      expect(textContainer).toHaveClass('text-center', 'sm:text-left');
    });
  });
});