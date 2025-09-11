import { describe, it, beforeEach, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
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

  it('updates progress when toggling task completion', async () => {
    localStorage.setItem(
      'goal-steps:project-settings',
      JSON.stringify({ name: 'P', deadline: '2025-12-31' }),
    );
    const categories = [
      {
        id: 'c1',
        name: 'カテゴリ1',
        minAmount: 1,
        maxAmount: 1,
        minUnit: 1,
        createdAt: '',
        updatedAt: '',
      },
    ];
    localStorage.setItem('goal-steps:categories', JSON.stringify(categories));
    const today = new Date().toISOString().slice(0, 10);
    const tasks = [
      { id: 't1', categoryId: 'c1', amount: 1, date: today, completed: false },
    ];
    localStorage.setItem('goal-steps:tasks', JSON.stringify(tasks));
    render(<PlannerPage />);
    expect(await screen.findByText('進捗率: 0%')).toBeInTheDocument();
    const block = await screen.findByTestId('task-block');
    fireEvent.click(within(block).getByRole('checkbox'));
    expect(await screen.findByText('進捗率: 100%')).toBeInTheDocument();
  });
});

