import { describe, it, beforeEach, expect } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarView from './CalendarView';

describe('CalendarView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('displays tasks from localStorage on corresponding dates', () => {
    localStorage.setItem(
      'goal-steps:categories',
      JSON.stringify([
        {
          id: 'c1',
          name: 'カテゴリ1',
          minAmount: 1,
          maxAmount: 1,
          minUnit: 1,
          createdAt: '',
          updatedAt: '',
        },
      ]),
    );
    localStorage.setItem(
      'goal-steps:tasks',
      JSON.stringify([
        { id: 't1', categoryId: 'c1', amount: 2, date: '2025-01-05', completed: false },
      ]),
    );

    render(<CalendarView initialDate={new Date('2025-01-01')} />);
    const cell = screen.getByLabelText('2025-01-05');
    expect(within(cell).getByText('カテゴリ1: 2')).toBeInTheDocument();
  });

  it('updates when tasks:updated event is dispatched', async () => {
    localStorage.setItem(
      'goal-steps:categories',
      JSON.stringify([
        {
          id: 'c1',
          name: 'カテゴリ1',
          minAmount: 1,
          maxAmount: 1,
          minUnit: 1,
          createdAt: '',
          updatedAt: '',
        },
      ]),
    );
    render(<CalendarView initialDate={new Date('2025-01-01')} />);
    localStorage.setItem(
      'goal-steps:tasks',
      JSON.stringify([
        { id: 't2', categoryId: 'c1', amount: 3, date: '2025-01-10', completed: false },
      ]),
    );
    window.dispatchEvent(new Event('tasks:updated'));
    const cell = screen.getByLabelText('2025-01-10');
    await waitFor(() => {
      expect(within(cell).getByText('カテゴリ1: 3')).toBeInTheDocument();
    });
  });
});
