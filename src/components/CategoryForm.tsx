import { useState } from 'react';
import { type Category } from '~/types';

interface CategoryFormProps {
  category?: Category;
  onSubmit: (
    name: string,
    valueRange: { min: number; max: number },
    deadline: string | undefined,
    minUnit: number
  ) => Promise<Category | null>;
  onCancel: () => void;
  submitButtonText?: string;
  projectDeadline?: string;
}

function CategoryForm({
  category,
  onSubmit,
  onCancel,
  submitButtonText = '作成',
  projectDeadline
}: CategoryFormProps) {
  const [name, setName] = useState(category?.name || '');
  const [minValue, setMinValue] = useState(category?.valueRange.min || 1);
  const [maxValue, setMaxValue] = useState(category?.valueRange.max || 10);
  const [deadline, setDeadline] = useState(category?.deadline || '');
  const [minUnit, setMinUnit] = useState(category?.minUnit || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await onSubmit(
        name,
        { min: minValue, max: maxValue },
        deadline || undefined,
        minUnit
      );
      if (result) {
        // 成功時は親コンポーネントでフォームを閉じる
      } else {
        setError('カテゴリーの保存に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-2">
          カテゴリー名
        </label>
        <input
          id="category-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：国語ワーク"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="min-value" className="block text-sm font-medium text-gray-700 mb-2">
            最小値
          </label>
          <input
            id="min-value"
            type="number"
            min="1"
            value={minValue}
            onChange={(e) => setMinValue(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting}
            required
          />
        </div>
        <div>
          <label htmlFor="max-value" className="block text-sm font-medium text-gray-700 mb-2">
            最大値
          </label>
          <input
            id="max-value"
            type="number"
            min="1"
            value={maxValue}
            onChange={(e) => setMaxValue(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="min-unit" className="block text-sm font-medium text-gray-700 mb-2">
          最小単位
        </label>
        <input
          id="min-unit"
          type="number"
          min="1"
          value={minUnit}
          onChange={(e) => setMinUnit(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isSubmitting}
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          タスクを分割する際の最小単位を設定します
        </p>
      </div>

      <div>
        <label htmlFor="category-deadline" className="block text-sm font-medium text-gray-700 mb-2">
          期限（任意）
        </label>
        <input
          id="category-deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          max={projectDeadline}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isSubmitting}
        />
        {projectDeadline && (
          <p className="mt-1 text-sm text-gray-500">
            プロジェクト期限: {new Date(projectDeadline).toLocaleDateString('ja-JP')}
          </p>
        )}
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-2">設定プレビュー</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>範囲: {minValue} 〜 {maxValue}</div>
          <div>最小単位: {minUnit}</div>
          <div>
            想定ブロック数: {Math.ceil((maxValue - minValue + 1) / minUnit)} ブロック
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '保存中...' : submitButtonText}
        </button>
      </div>
    </form>
  );
}

export default CategoryForm;