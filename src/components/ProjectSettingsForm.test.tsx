import { describe, it, beforeEach, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectSettingsForm from './ProjectSettingsForm';

const STORAGE_KEY = 'goal-steps:project-settings';

describe('ProjectSettingsForm', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves project name and deadline to localStorage and displays them', () => {
    render(<ProjectSettingsForm />);

    fireEvent.change(screen.getByLabelText('プロジェクト名'), {
      target: { value: 'テストプロジェクト' },
    });
    fireEvent.change(screen.getByLabelText('期限'), {
      target: { value: '2025-12-31' },
    });

    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    expect(stored).toEqual({ name: 'テストプロジェクト', deadline: '2025-12-31' });
    expect(screen.getByText('テストプロジェクト')).toBeInTheDocument();
    expect(screen.getByText('2025-12-31')).toBeInTheDocument();
  });
});
