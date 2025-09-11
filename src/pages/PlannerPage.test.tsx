import { describe, it, beforeEach, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlannerPage from './PlannerPage';

describe('PlannerPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('allows adding categories and planning tasks', () => {
    localStorage.setItem(
      'goal-steps:project-settings',
      JSON.stringify({ name: 'P', deadline: '2025-12-31' }),
    );
    render(<PlannerPage />);
    fireEvent.change(screen.getByLabelText('カテゴリー名'), { target: { value: '国語' } });
    fireEvent.change(screen.getByLabelText('量（最小）'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('量（最大）'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('最小単位'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: '追加' }));
    expect(screen.getByText('国語')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '自動計画を作成' }));
    expect(screen.getByText(/タスクを\d+件作成しました/)).toBeInTheDocument();
  });
});

