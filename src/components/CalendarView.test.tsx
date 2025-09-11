import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarView from './CalendarView';
import type { Category, TaskBlock } from '~/types';

describe('CalendarView', () => {
  it('renders day names', () => {
    render(
      <CalendarView
        tasks={[]}
        categories={[]}
        initialDate={new Date('2025-01-01')}
      />,
    );
    const names = ['月', '火', '水', '木', '金', '土', '日'];
    for (const n of names) {
      expect(screen.getByText(n)).toBeInTheDocument();
    }
  });

  it('aligns first day to correct weekday with Monday start', () => {
    render(
      <CalendarView
        tasks={[]}
        categories={[]}
        initialDate={new Date('2025-01-01')}
      />,
    );
    const grid = screen.getByRole('grid');
    const cells = within(grid).getAllByRole('gridcell', { hidden: true });
    expect(cells[2]).toHaveAttribute('aria-label', '2025-01-01');
  });

  it('displays tasks on corresponding dates', () => {
    const categories: Category[] = [
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
    const tasks: TaskBlock[] = [
      { id: 't1', categoryId: 'c1', amount: 2, date: '2025-01-05', completed: false },
    ];
    render(
      <CalendarView
        tasks={tasks}
        categories={categories}
        initialDate={new Date('2025-01-01')}
      />,
    );
    const cell = screen.getByLabelText('2025-01-05');
    expect(within(cell).getByText('カテゴリ1: 2')).toBeInTheDocument();
  });

  it('updates when tasks prop changes', () => {
    const categories: Category[] = [
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
    const tasks: TaskBlock[] = [];
    const { rerender } = render(
      <CalendarView
        tasks={tasks}
        categories={categories}
        initialDate={new Date('2025-01-01')}
      />,
    );
    tasks.push({ id: 't2', categoryId: 'c1', amount: 3, date: '2025-01-10', completed: false });
    rerender(
      <CalendarView
        tasks={tasks}
        categories={categories}
        initialDate={new Date('2025-01-01')}
      />,
    );
    const cell = screen.getByLabelText('2025-01-10');
    expect(within(cell).getByText('カテゴリ1: 3')).toBeInTheDocument();
  });

  it('shows category names when categories prop updates', () => {
    const categories: Category[] = [];
    const tasks: TaskBlock[] = [
      { id: 't3', categoryId: 'c2', amount: 4, date: '2025-01-15', completed: false },
    ];
    const { rerender } = render(
      <CalendarView
        tasks={tasks}
        categories={categories}
        initialDate={new Date('2025-01-01')}
      />,
    );
    categories.push({
      id: 'c2',
      name: 'カテゴリ2',
      minAmount: 1,
      maxAmount: 1,
      minUnit: 1,
      createdAt: '',
      updatedAt: '',
    });
    rerender(
      <CalendarView
        tasks={tasks}
        categories={[...categories]}
        initialDate={new Date('2025-01-01')}
      />,
    );
    const cell = screen.getByLabelText('2025-01-15');
    expect(within(cell).getByText('カテゴリ2: 4')).toBeInTheDocument();
  });
});

