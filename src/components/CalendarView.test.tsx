import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarView from './CalendarView';
import type { Category, TaskBlock } from '~/types';
import { useState, type FC } from 'react';

describe('CalendarView', () => {
  it('renders day names', () => {
    render(<CalendarView tasks={[]} categories={[]} initialDate={new Date('2025-01-01')} />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(7);
    const texts = headers.map((h) => h.textContent);
    expect(texts).toEqual(['月', '火', '水', '木', '金', '土', '日']);
    headers.forEach((h) => {
      expect(h).toHaveAttribute('aria-label');
    });
  });

  it('aligns first day to correct weekday with Monday start', () => {
    render(<CalendarView tasks={[]} categories={[]} initialDate={new Date('2025-01-01')} />);
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
      <CalendarView tasks={tasks} categories={categories} initialDate={new Date('2025-01-01')} />,
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
      <CalendarView tasks={tasks} categories={categories} initialDate={new Date('2025-01-01')} />,
    );
    tasks.push({ id: 't2', categoryId: 'c1', amount: 3, date: '2025-01-10', completed: false });
    rerender(
      <CalendarView tasks={tasks} categories={categories} initialDate={new Date('2025-01-01')} />,
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
      <CalendarView tasks={tasks} categories={categories} initialDate={new Date('2025-01-01')} />,
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

  it('displays daily progress bar with completed and total counts', () => {
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
      { id: 't1', categoryId: 'c1', amount: 1, date: '2025-01-10', completed: false },
      { id: 't2', categoryId: 'c1', amount: 1, date: '2025-01-10', completed: true },
    ];
    render(
      <CalendarView tasks={tasks} categories={categories} initialDate={new Date('2025-01-01')} />,
    );
    const cell = screen.getByLabelText('2025-01-10');
    const bar = within(cell).getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '1');
    expect(bar).toHaveAttribute('aria-valuemax', '2');
    expect(within(cell).getByText('1/2')).toBeInTheDocument();
  });

  it('toggles task completion', () => {
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
    const initial: TaskBlock[] = [
      { id: 't1', categoryId: 'c1', amount: 1, date: '2025-01-05', completed: false },
    ];

    const Wrapper: FC = () => {
      const [ts, setTs] = useState<TaskBlock[]>(initial);
      return (
        <CalendarView
          tasks={ts}
          categories={categories}
          initialDate={new Date('2025-01-01')}
          onToggleTask={(id) =>
            setTs((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
          }
        />
      );
    };

    render(<Wrapper />);
    const cell = screen.getByLabelText('2025-01-05');
    const block = within(cell).getByTestId('task-block');
    expect(block).not.toHaveClass('opacity-50');
    fireEvent.click(within(block).getByRole('checkbox'));
    expect(block).toHaveClass('opacity-50');
  });

  it('does not toggle completion in move mode', () => {
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
      { id: 't1', categoryId: 'c1', amount: 1, date: '2025-01-05', completed: false },
    ];
    const toggle = vi.fn();
    render(
      <CalendarView
        tasks={tasks}
        categories={categories}
        initialDate={new Date('2025-01-01')}
        onToggleTask={toggle}
      />,
    );
    const moveBtn = screen.getByRole('button', { name: 'タスク移動モード' });
    fireEvent.click(moveBtn);
    const cell = screen.getByLabelText('2025-01-05');
    const block = within(cell).getByTestId('task-block');
    fireEvent.click(within(block).getByText('カテゴリ1: 1'));
    expect(toggle).not.toHaveBeenCalled();
    expect(block).not.toHaveClass('opacity-50');
  });

  it('prevents dragging completed tasks', () => {
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
      { id: 't1', categoryId: 'c1', amount: 1, date: '2025-01-05', completed: true },
    ];
    render(
      <CalendarView tasks={tasks} categories={categories} initialDate={new Date('2025-01-01')} />,
    );
    const block = screen.getByTestId('task-block');
    expect(block).not.toHaveAttribute('draggable', 'true');
  });

  it('allows dragging incomplete task to another date', () => {
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
    const initial: TaskBlock[] = [
      { id: 't1', categoryId: 'c1', amount: 1, date: '2025-01-05', completed: false },
    ];

    const Wrapper: FC = () => {
      const [ts, setTs] = useState<TaskBlock[]>(initial);
      return (
        <CalendarView
          tasks={ts}
          categories={categories}
          initialDate={new Date('2025-01-01')}
          onMoveTask={(id, date) =>
            setTs((prev) => prev.map((t) => (t.id === id ? { ...t, date } : t)))
          }
        />
      );
    };

    render(<Wrapper />);

    const block = screen.getByTestId('task-block');
    const targetCell = screen.getByLabelText('2025-01-06');
    const store: { value?: string } = {};
    const data = {
      dropEffect: 'none',
      effectAllowed: 'all',
      files: {} as FileList,
      items: {} as DataTransferItemList,
      types: [] as string[],
      setData: (_: string, value: string) => {
        store.value = value;
      },
      getData: () => store.value ?? '',
      clearData: () => {
        store.value = undefined;
      },
      setDragImage: () => {},
    } as DataTransfer;
    fireEvent.dragStart(block, { dataTransfer: data });
    fireEvent.dragOver(targetCell, { dataTransfer: data });
    fireEvent.drop(targetCell, { dataTransfer: data });

    expect(within(targetCell).getByText('カテゴリ1: 1')).toBeInTheDocument();
  });

  it('moves task via touch interaction', () => {
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
    const initial: TaskBlock[] = [
      { id: 't1', categoryId: 'c1', amount: 1, date: '2025-01-05', completed: false },
    ];

    const Wrapper: FC = () => {
      const [ts, setTs] = useState<TaskBlock[]>(initial);
      return (
        <CalendarView
          tasks={ts}
          categories={categories}
          initialDate={new Date('2025-01-01')}
          onMoveTask={(id, date) =>
            setTs((prev) => prev.map((t) => (t.id === id ? { ...t, date } : t)))
          }
        />
      );
    };

    render(<Wrapper />);

    const block = screen.getByTestId('task-block');
    const targetCell = screen.getByLabelText('2025-01-06');
    const doc = document as { elementFromPoint: (x: number, y: number) => Element | null };
    const original = doc.elementFromPoint;
    doc.elementFromPoint = () => targetCell;

    fireEvent.touchStart(block, { touches: [{ clientX: 0, clientY: 0 }] });
    fireEvent.touchEnd(document, { changedTouches: [{ clientX: 10, clientY: 10 }] });

    doc.elementFromPoint = original;
    expect(within(targetCell).getByText('カテゴリ1: 1')).toBeInTheDocument();
  });

  it('moves task via move mode selection', () => {
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
    const initial: TaskBlock[] = [
      { id: 't1', categoryId: 'c1', amount: 1, date: '2025-01-05', completed: false },
    ];

    const Wrapper: FC = () => {
      const [ts, setTs] = useState<TaskBlock[]>(initial);
      return (
        <CalendarView
          tasks={ts}
          categories={categories}
          initialDate={new Date('2025-01-01')}
          onMoveTask={(id, date) =>
            setTs((prev) => prev.map((t) => (t.id === id ? { ...t, date } : t)))
          }
        />
      );
    };

    render(<Wrapper />);

    const moveBtn = screen.getByRole('button', { name: 'タスク移動モード' });
    fireEvent.click(moveBtn);
    const sourceCell = screen.getByLabelText('2025-01-05');
    const block = within(sourceCell).getByTestId('task-block');
    fireEvent.click(block);
    const targetCell = screen.getByLabelText('2025-01-06');
    fireEvent.click(targetCell);

    expect(within(targetCell).getByText('カテゴリ1: 1')).toBeInTheDocument();
  });
});
