import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CategoryManager from './CategoryManager';
import type { Category } from '~/types';

describe('CategoryManager', () => {
  it('creates a category via callback', () => {
    const categories: Category[] = [];
    const handleAdd = (c: Category) => categories.push(c);
    const { rerender } = render(
      <CategoryManager
        categories={categories}
        onAdd={handleAdd}
        onUpdate={() => {}}
        onDelete={() => {}}
      />,
    );

    fireEvent.change(screen.getByLabelText('カテゴリー名'), {
      target: { value: '国語ワーク' },
    });
    fireEvent.change(screen.getByLabelText('量（最小）'), {
      target: { value: '20' },
    });
    fireEvent.change(screen.getByLabelText('量（最大）'), {
      target: { value: '60' },
    });
    fireEvent.change(screen.getByLabelText('最小単位'), {
      target: { value: '2' },
    });

    fireEvent.click(screen.getByRole('button', { name: '追加' }));

    expect(categories.length).toBe(1);
    rerender(
      <CategoryManager
        categories={categories}
        onAdd={handleAdd}
        onUpdate={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText('国語ワーク')).toBeInTheDocument();
    expect(screen.getByText(/量: 20 - 60 \/ 最小単位: 2/)).toBeInTheDocument();
  });

  it('shows inline validation errors when fields are invalid', async () => {
    render(
      <CategoryManager
        categories={[]}
        onAdd={() => {}}
        onUpdate={() => {}}
        onDelete={() => {}}
      />,
    );

    const nameInput = screen.getByLabelText('カテゴリー名');
    nameInput.focus();
    nameInput.blur();
    expect(await screen.findByText('必須です')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('カテゴリー名'), {
      target: { value: 'チェック' },
    });
    fireEvent.change(screen.getByLabelText('量（最小）'), { target: { value: '60' } });
    fireEvent.blur(screen.getByLabelText('量（最小）'));
    fireEvent.change(screen.getByLabelText('量（最大）'), { target: { value: '20' } });
    fireEvent.blur(screen.getByLabelText('量（最大）'));
    fireEvent.change(screen.getByLabelText('最小単位'), { target: { value: '1' } });
    fireEvent.blur(screen.getByLabelText('最小単位'));

    const msgs = await screen.findAllByText('最小は最大以下で入力してください');
    expect(msgs.length).toBeGreaterThanOrEqual(2);
  });

  it('validates category deadline against project deadline (must be earlier or same day)', async () => {
    localStorage.setItem(
      'goal-steps:project-settings',
      JSON.stringify({ name: 'P', deadline: '2025-12-31' }),
    );

    render(
      <CategoryManager
        categories={[]}
        onAdd={() => {}}
        onUpdate={() => {}}
        onDelete={() => {}}
      />,
    );

    fireEvent.change(screen.getByLabelText('カテゴリー名'), {
      target: { value: '締切チェック' },
    });
    fireEvent.change(screen.getByLabelText('量（最小）'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('量（最大）'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('最小単位'), { target: { value: '1' } });

    const dl = screen.getByLabelText('カテゴリー期限（任意）');
    fireEvent.change(dl, {
      target: { value: '2026-01-01' },
    });
    fireEvent.blur(dl);

    expect(
      await screen.findByText('プロジェクト期限以前の日付を入力してください'),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('カテゴリー期限（任意）'), {
      target: { value: '2025-12-31' },
    });
    fireEvent.blur(screen.getByLabelText('カテゴリー期限（任意）'));

    expect(
      screen.queryByText('プロジェクト期限以前の日付を入力してください'),
    ).not.toBeInTheDocument();
  });

  it('allows editing an existing category', () => {
    const categories: Category[] = [
      {
        id: 'a',
        name: '国語',
        minAmount: 1,
        maxAmount: 3,
        minUnit: 1,
        createdAt: 't',
        updatedAt: 't',
      },
    ];
    const handleUpdate = (c: Category) => {
      categories[0] = c;
    };
    const { rerender } = render(
      <CategoryManager
        categories={categories}
        onAdd={() => {}}
        onUpdate={handleUpdate}
        onDelete={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '編集' }));
    fireEvent.change(screen.getByLabelText('カテゴリー名'), {
      target: { value: '数学' },
    });
    fireEvent.click(screen.getByRole('button', { name: '更新' }));

    expect(categories[0].name).toBe('数学');
    rerender(
      <CategoryManager
        categories={categories}
        onAdd={() => {}}
        onUpdate={handleUpdate}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText('数学')).toBeInTheDocument();
  });

  it('allows deleting a category', () => {
    const categories: Category[] = [
      {
        id: 'a',
        name: '国語',
        minAmount: 1,
        maxAmount: 3,
        minUnit: 1,
        createdAt: 't',
        updatedAt: 't',
      },
      {
        id: 'b',
        name: '数学',
        minAmount: 1,
        maxAmount: 3,
        minUnit: 1,
        createdAt: 't',
        updatedAt: 't',
      },
    ];
    const handleDelete = (id: string) => {
      const idx = categories.findIndex((c) => c.id === id);
      if (idx >= 0) categories.splice(idx, 1);
    };
    const { rerender } = render(
      <CategoryManager
        categories={categories}
        onAdd={() => {}}
        onUpdate={() => {}}
        onDelete={handleDelete}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: '削除' })[0]);
    expect(categories.length).toBe(1);
    rerender(
      <CategoryManager
        categories={categories}
        onAdd={() => {}}
        onUpdate={() => {}}
        onDelete={handleDelete}
      />,
    );
    expect(screen.queryByText('国語')).not.toBeInTheDocument();
  });
});

