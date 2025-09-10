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
});

