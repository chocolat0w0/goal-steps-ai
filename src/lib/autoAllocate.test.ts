import { describe, it, beforeEach, expect } from 'vitest';
import autoAllocateTasks from './autoAllocate';
import type { Category } from '~/types';

const CAT_KEY = 'goal-steps:categories';
const PROJ_KEY = 'goal-steps:project-settings';

describe('autoAllocateTasks', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('limits total amount per day across categories', () => {
    const today = new Date('2025-01-01');
    const categories: Category[] = [
      {
        id: 'a',
        name: 'A',
        minAmount: 10,
        maxAmount: 10,
        minUnit: 1,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'b',
        name: 'B',
        minAmount: 10,
        maxAmount: 10,
        minUnit: 1,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'c',
        name: 'C',
        minAmount: 10,
        maxAmount: 10,
        minUnit: 1,
        createdAt: '',
        updatedAt: '',
      },
    ];
    localStorage.setItem(CAT_KEY, JSON.stringify(categories));
    localStorage.setItem(PROJ_KEY, JSON.stringify({ deadline: '2025-01-03' }));

    const tasks = autoAllocateTasks(today);
    const totals: Record<string, number> = {};
    for (const t of tasks) {
      totals[t.date] = (totals[t.date] || 0) + t.amount;
    }

    expect(totals['2025-01-01']).toBeLessThanOrEqual(10);
    expect(totals['2025-01-02']).toBeLessThanOrEqual(10);
    expect(totals['2025-01-03']).toBeLessThanOrEqual(10);
  });
});

