import { describe, it, beforeEach, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AutoPlanButton from './AutoPlanButton';

const CAT_KEY = 'goal-steps:categories';
const PROJ_KEY = 'goal-steps:project-settings';
const TASK_KEY = 'goal-steps:tasks';

describe('AutoPlanButton', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates tasks into localStorage when clicked', () => {
    localStorage.setItem(PROJ_KEY, JSON.stringify({ name: 'P', deadline: '2025-12-31' }));
    localStorage.setItem(
      CAT_KEY,
      JSON.stringify([
        {
          id: 'c1',
          name: '国語',
          minAmount: 20,
          maxAmount: 20,
          minUnit: 2,
          createdAt: '',
          updatedAt: '',
        },
      ]),
    );

    render(<AutoPlanButton />);
    fireEvent.click(screen.getByRole('button', { name: '自動計画を作成' }));
    const stored = JSON.parse(localStorage.getItem(TASK_KEY) || '[]');
    expect(Array.isArray(stored)).toBe(true);
    expect(stored.length).toBeGreaterThan(0);
    expect(screen.getByText(/タスクを\d+件作成しました/)).toBeInTheDocument();
  });
});
