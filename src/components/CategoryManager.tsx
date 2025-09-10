import { useEffect, useMemo, useState, type FC, type FormEvent } from 'react';
import type { Category } from '~/types';

const STORAGE_KEY = 'goal-steps:categories';

const nowIso = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

const CategoryManager: FC = () => {
  const [name, setName] = useState('');
  const [minAmount, setMinAmount] = useState<number | ''>('');
  const [maxAmount, setMaxAmount] = useState<number | ''>('');
  const [minUnit, setMinUnit] = useState<number | ''>(1);
  const [deadline, setDeadline] = useState<string>('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Category[];
        setCategories(parsed);
      } catch {
        // noop
      }
    }
  }, []);

  const valid = useMemo(() => {
    if (!name.trim()) return false;
    if (minAmount === '' || maxAmount === '' || minUnit === '') return false;
    if (minAmount <= 0 || maxAmount <= 0 || minUnit <= 0) return false;
    if (minAmount > maxAmount) return false;
    if (!Number.isInteger(minUnit)) return false;
    return true;
  }, [name, minAmount, maxAmount, minUnit]);

  const resetForm = () => {
    setName('');
    setMinAmount('');
    setMaxAmount('');
    setMinUnit(1);
    setDeadline('');
    setError(null);
  };

  const persist = (next: Category[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setCategories(next);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!valid) {
      setError('入力内容を確認してください');
      return;
    }
    const ts = nowIso();
    const item: Category = {
      id: uid(),
      name: name.trim(),
      minAmount: Number(minAmount),
      maxAmount: Number(maxAmount),
      minUnit: Number(minUnit),
      deadline: deadline || undefined,
      createdAt: ts,
      updatedAt: ts,
    };
    const next = [...categories, item];
    persist(next);
    resetForm();
  };

  return (
    <section className="rounded-lg border bg-white p-6 shadow-sm mt-8" aria-label="カテゴリー管理">
      <h2 className="text-lg font-semibold mb-4">カテゴリーの追加</h2>
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2" aria-label="カテゴリー作成フォーム">
        <div>
          <label htmlFor="cat-name" className="block text-sm font-medium">カテゴリー名</label>
          <input
            id="cat-name"
            type="text"
            className="mt-1 w-full rounded border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="cat-min" className="block text-sm font-medium">量（最小）</label>
            <input
              id="cat-min"
              type="number"
              min={1}
              step={1}
              className="mt-1 w-full rounded border px-3 py-2"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value === '' ? '' : Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label htmlFor="cat-max" className="block text-sm font-medium">量（最大）</label>
            <input
              id="cat-max"
              type="number"
              min={1}
              step={1}
              className="mt-1 w-full rounded border px-3 py-2"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value === '' ? '' : Number(e.target.value))}
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="cat-unit" className="block text-sm font-medium">最小単位</label>
          <input
            id="cat-unit"
            type="number"
            min={1}
            step={1}
            className="mt-1 w-full rounded border px-3 py-2"
            value={minUnit}
            onChange={(e) => setMinUnit(e.target.value === '' ? '' : Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label htmlFor="cat-deadline" className="block text-sm font-medium">カテゴリー期限（任意）</label>
          <input
            id="cat-deadline"
            type="date"
            className="mt-1 w-full rounded border px-3 py-2"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
            disabled={!valid}
          >
            追加
          </button>
          {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </form>

      <div className="mt-6">
        <h3 className="font-medium mb-2">登録済みカテゴリー</h3>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-600">まだカテゴリーがありません</p>
        ) : (
          <ul className="divide-y rounded border">
            {categories.map((c) => (
              <li key={c.id} className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-gray-600">
                    量: {c.minAmount} - {c.maxAmount} / 最小単位: {c.minUnit}
                    {c.deadline ? ` / 期限: ${c.deadline}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default CategoryManager;
