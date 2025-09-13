import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { MutableRefObject } from 'react';
import { describe, it, expect } from 'vitest';
import CalendarCell from './CalendarCell';
import type { TaskBlock } from '~/types';

describe('CalendarCell', () => {
  it('renders day and tasks', () => {
    const nameMap = new Map<string, string>([['c1', 'カテゴリ1']]);
    const tasks: TaskBlock[] = [
      { id: 't1', categoryId: 'c1', amount: 1, date: '2025-01-01', completed: false },
    ];
    const draggingRef: MutableRefObject<string | null> = { current: null };
    const selectedRef: MutableRefObject<string | null> = { current: null };
    render(
      <CalendarCell
        dateStr="2025-01-01"
        day={1}
        tasks={tasks}
        nameMap={nameMap}
        isDragOver={false}
        moveMode={false}
        draggingId={null}
        selectedId={null}
        draggingIdRef={draggingRef}
        selectedIdRef={selectedRef}
        setDragOverDate={() => {}}
        setDraggingId={() => {}}
        setSelectedId={() => {}}
        view="month"
      />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('カテゴリ1: 1')).toBeInTheDocument();
  });

  it('applies gray style for other month', () => {
    const draggingRef: MutableRefObject<string | null> = { current: null };
    const selectedRef: MutableRefObject<string | null> = { current: null };
    render(
      <CalendarCell
        dateStr="2024-12-31"
        day={31}
        tasks={[]}
        nameMap={new Map()}
        isDragOver={false}
        moveMode={false}
        draggingId={null}
        selectedId={null}
        draggingIdRef={draggingRef}
        selectedIdRef={selectedRef}
        setDragOverDate={() => {}}
        setDraggingId={() => {}}
        setSelectedId={() => {}}
        isCurrentMonth={false}
        view="month"
      />
    );
    expect(screen.getByRole('gridcell')).toHaveClass('bg-gray-50');
  });
});
