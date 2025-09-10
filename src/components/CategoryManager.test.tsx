import { describe, it, beforeEach, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CategoryManager from './CategoryManager';

const STORAGE_KEY = 'goal-steps:categories';

describe('CategoryManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates a category and stores it in localStorage', () => {
    render(<CategoryManager />);

    fireEvent.change(screen.getByLabelText('カテゴリー名'), {
      target: { value: '国語ワーク' },
    });
    fireEvent.change(screen.getByLabelText('量（最小）'), {
      target: { value: '20' },
    });
    fireEvent.change(screen.getByLabelText('量（最大）'), {
      target: { value: '60' },
    });
    fireEvent.change(screen.getByLabelText('最小単位'), {
      target: { value: '2' },
    });

    fireEvent.click(screen.getByRole('button', { name: '追加' }));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    expect(Array.isArray(stored)).toBe(true);
    expect(stored.length).toBe(1);
    expect(stored[0].name).toBe('国語ワーク');
    expect(stored[0].minAmount).toBe(20);
    expect(stored[0].maxAmount).toBe(60);
    expect(stored[0].minUnit).toBe(2);

    // Listed on screen
    expect(screen.getByText('国語ワーク')).toBeInTheDocument();
    expect(screen.getByText(/量: 20 - 60 \/ 最小単位: 2/)).toBeInTheDocument();
  });

  it('shows inline validation errors when fields are invalid', async () => {
    render(<CategoryManager />);

    // name required
    const nameInput = screen.getByLabelText('カテゴリー名');
    nameInput.focus();
    nameInput.blur();
    expect(await screen.findByText('必須です')).toBeInTheDocument();

    // range validation: min > max
    fireEvent.change(screen.getByLabelText('カテゴリー名'), {
      target: { value: 'チェック' },
    });
    fireEvent.change(screen.getByLabelText('量（最小）'), { target: { value: '60' } });
    fireEvent.blur(screen.getByLabelText('量（最小）'));
    fireEvent.change(screen.getByLabelText('量（最大）'), { target: { value: '20' } });
    fireEvent.blur(screen.getByLabelText('量（最大）'));
    fireEvent.change(screen.getByLabelText('最小単位'), { target: { value: '1' } });
    fireEvent.blur(screen.getByLabelText('最小単位'));

    // Both min and max should show range error
    const msgs = await screen.findAllByText('最小は最大以下で入力してください');
    expect(msgs.length).toBeGreaterThanOrEqual(2);
  });

  it('validates category deadline against project deadline (must be earlier or same day)', async () => {
    // Set project deadline in localStorage
    localStorage.setItem(
      'goal-steps:project-settings',
      JSON.stringify({ name: 'P', deadline: '2025-12-31' })
    );

    render(<CategoryManager />);

    // Fill required fields minimally to enable validation state
    fireEvent.change(screen.getByLabelText('カテゴリー名'), {
      target: { value: '締切チェック' },
    });
    fireEvent.change(screen.getByLabelText('量（最小）'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('量（最大）'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('最小単位'), { target: { value: '1' } });

    // Set category deadline after project deadline
    const dl = screen.getByLabelText('カテゴリー期限（任意）');
    fireEvent.change(dl, {
      target: { value: '2026-01-01' },
    });
    fireEvent.blur(dl);

    expect(
      await screen.findByText('プロジェクト期限以前の日付を入力してください')
    ).toBeInTheDocument();

    // Fix to same day (allowed)
    fireEvent.change(screen.getByLabelText('カテゴリー期限（任意）'), {
      target: { value: '2025-12-31' },
    });

    // Blur again to revalidate
    fireEvent.blur(screen.getByLabelText('カテゴリー期限（任意）'));

    // Error should disappear
    expect(
      screen.queryByText('プロジェクト期限以前の日付を入力してください')
    ).not.toBeInTheDocument();
  });
});
