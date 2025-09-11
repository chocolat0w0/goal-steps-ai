import { describe, it, beforeEach, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarView from './CalendarView';

describe('CalendarView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('displays tasks from localStorage on corresponding dates', () => {
    localStorage.setItem(
      'goal-steps:tasks',
      JSON.stringify([
        { id: 't1', categoryId: 'c1', amount: 2, date: '2025-01-05', completed: false },
      ]),
    );

    render(<CalendarView initialDate={new Date('2025-01-01')} />);
    const cell = screen.getByLabelText('2025-01-05');
    expect(within(cell).getByText('c1: 2')).toBeInTheDocument();
  });
});
