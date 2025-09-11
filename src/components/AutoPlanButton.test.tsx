import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AutoPlanButton from './AutoPlanButton';

describe('AutoPlanButton', () => {
  it('calls onPlan and shows message', () => {
    const onPlan = vi.fn().mockReturnValue(3);
    render(<AutoPlanButton onPlan={onPlan} />);
    fireEvent.click(screen.getByRole('button', { name: '自動計画を作成' }));
    expect(onPlan).toHaveBeenCalled();
    expect(screen.getByText('タスクを3件作成しました')).toBeInTheDocument();
  });
});
