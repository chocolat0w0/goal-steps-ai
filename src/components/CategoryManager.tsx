import { useEffect, useMemo, useState, type FC, type FormEvent, useCallback } from 'react';
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
  const [projectDeadline, setProjectDeadline] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [touched, setTouched] = useState({ name: false, min: false, max: false, unit: false, deadline: false });
  const [submitted, setSubmitted] = useState(false);

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
    const projRaw = localStorage.getItem('goal-steps:project-settings');
    if (projRaw) {
      try {
        const proj = JSON.parse(projRaw) as { name?: string; deadline?: string };
        if (proj.deadline) setProjectDeadline(proj.deadline);
      } catch {
        // noop
      }
    }
  }, []);

  const errors = useMemo(() => {
    const e: { name?: string; minAmount?: string; maxAmount?: string; minUnit?: string; deadline?: string } = {};
    if (!name.trim()) e.name = '必須です';
    if (minAmount === '') e.minAmount = '必須です';
    else if (minAmount <= 0) e.minAmount = '1以上で入力してください';
    if (maxAmount === '') e.maxAmount = '必須です';
    else if (maxAmount <= 0) e.maxAmount = '1以上で入力してください';
    if (minAmount !== '' && maxAmount !== '' && minAmount > maxAmount) {
      e.minAmount = '最小は最大以下で入力してください';
      e.maxAmount = '最小は最大以下で入力してください';
    }
    if (minUnit === '') e.minUnit = '必須です';
    else if (minUnit <= 0) e.minUnit = '1以上で入力してください';
    else if (!Number.isInteger(minUnit)) e.minUnit = '整数で入力してください';
    if (deadline && projectDeadline) {
      // 期限はプロジェクト期限「以前」（同日含む）とする
      if (deadline > projectDeadline) {
        e.deadline = 'プロジェクト期限以前の日付を入力してください';
      }
    }
    return e;
  }, [name, minAmount, maxAmount, minUnit, deadline, projectDeadline]);

  const valid = Object.keys(errors).length === 0;

  const resetForm = () => {
    setName('');
    setMinAmount('');
    setMaxAmount('');
    setMinUnit(1);
    setDeadline('');
    setTouched({ name: false, min: false, max: false, unit: false, deadline: false });
    setSubmitted(false);
  };

  const persist = (next: Category[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setCategories(next);
    window.dispatchEvent(new Event('categories:updated'));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (!valid) return;
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

  const markTouched = useCallback((key: 'name' | 'min' | 'max' | 'unit' | 'deadline') => {
    setTouched((t) => ({ ...t, [key]: true }));
  }, []);

  return (
    <section className="rounded-lg border bg-white p-6 shadow-sm mt-8" aria-label="カテゴリー管理">
      <h2 className="text-lg font-semibold mb-4">カテゴリーの追加</h2>
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2" aria-label="カテゴリー作成フォーム">
        <div>
          <label htmlFor="cat-name" className="block text-sm font-medium">カテゴリー名</label>
          <input
            id="cat-name"
            type="text"
            className={`mt-1 w-full rounded border px-3 py-2 ${((touched.name || submitted) && errors.name) ? 'border-red-500' : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => markTouched('name')}
            aria-invalid={Boolean((touched.name || submitted) && errors.name)}
            aria-describedby={(touched.name || submitted) && errors.name ? 'cat-name-error' : undefined}
            required
          />
          {(touched.name || submitted) && errors.name && (
            <p id="cat-name-error" className="mt-1 text-xs text-red-600">{errors.name}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="cat-min" className="block text-sm font-medium">量（最小）</label>
            <input
              id="cat-min"
              type="number"
              min={1}
              step={1}
              className={`mt-1 w-full rounded border px-3 py-2 ${((touched.min || submitted) && errors.minAmount) ? 'border-red-500' : ''}`}
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => markTouched('min')}
              aria-invalid={Boolean((touched.min || submitted) && errors.minAmount)}
              aria-describedby={(touched.min || submitted) && errors.minAmount ? 'cat-min-error' : undefined}
              required
            />
            {(touched.min || submitted) && errors.minAmount && (
              <p id="cat-min-error" className="mt-1 text-xs text-red-600">{errors.minAmount}</p>
            )}
          </div>
          <div>
            <label htmlFor="cat-max" className="block text-sm font-medium">量（最大）</label>
            <input
              id="cat-max"
              type="number"
              min={1}
              step={1}
              className={`mt-1 w-full rounded border px-3 py-2 ${((touched.max || submitted) && errors.maxAmount) ? 'border-red-500' : ''}`}
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => markTouched('max')}
              aria-invalid={Boolean((touched.max || submitted) && errors.maxAmount)}
              aria-describedby={(touched.max || submitted) && errors.maxAmount ? 'cat-max-error' : undefined}
              required
            />
            {(touched.max || submitted) && errors.maxAmount && (
              <p id="cat-max-error" className="mt-1 text-xs text-red-600">{errors.maxAmount}</p>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="cat-unit" className="block text-sm font-medium">最小単位</label>
          <input
            id="cat-unit"
            type="number"
            min={1}
            step={1}
            className={`mt-1 w-full rounded border px-3 py-2 ${((touched.unit || submitted) && errors.minUnit) ? 'border-red-500' : ''}`}
            value={minUnit}
            onChange={(e) => setMinUnit(e.target.value === '' ? '' : Number(e.target.value))}
            onBlur={() => markTouched('unit')}
            aria-invalid={Boolean((touched.unit || submitted) && errors.minUnit)}
            aria-describedby={(touched.unit || submitted) && errors.minUnit ? 'cat-unit-error' : undefined}
            required
          />
          {(touched.unit || submitted) && errors.minUnit && (
            <p id="cat-unit-error" className="mt-1 text-xs text-red-600">{errors.minUnit}</p>
          )}
        </div>
        <div>
          <label htmlFor="cat-deadline" className="block text-sm font-medium">カテゴリー期限（任意）</label>
          <input
            id="cat-deadline"
            type="date"
            className={`mt-1 w-full rounded border px-3 py-2 ${((touched.deadline || submitted) && errors.deadline) ? 'border-red-500' : ''}`}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            onBlur={() => markTouched('deadline')}
            aria-invalid={Boolean((touched.deadline || submitted) && errors.deadline)}
            aria-describedby={(touched.deadline || submitted) && errors.deadline ? 'cat-deadline-error' : undefined}
          />
          {(touched.deadline || submitted) && errors.deadline && (
            <p id="cat-deadline-error" className="mt-1 text-xs text-red-600">{errors.deadline}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
            disabled={!valid}
          >
            追加
          </button>
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
