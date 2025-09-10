import { useState } from 'react';
import { type Category } from '~/types';

interface CategoryListProps {
  categories: Category[];
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => Promise<boolean>;
  getCategoryProgress: (category: Category) => {
    completed: number;
    total: number;
    percentage: number;
  };
}

function CategoryList({
  categories,
  onEditCategory,
  onDeleteCategory,
  getCategoryProgress
}: CategoryListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('このカテゴリーを削除しますか？関連するタスクブロックも削除されます。')) {
      return;
    }

    setDeletingId(id);
    try {
      const success = await onDeleteCategory(id);
      if (!success) {
        alert('カテゴリーの削除に失敗しました');
      }
    } catch {
      alert('カテゴリーの削除中にエラーが発生しました');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null;

    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)}日経過`;
    if (diffDays === 0) return '今日まで';
    return `残り${diffDays}日`;
  };

  const getDeadlineColor = (deadline?: string) => {
    if (!deadline) return 'text-gray-500';

    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600';
    if (diffDays <= 3) return 'text-orange-600';
    if (diffDays <= 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-4">カテゴリーがありません</div>
        <p className="text-gray-500">新しいカテゴリーを作成して目標を分解しましょう</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const progress = getCategoryProgress(category);
        return (
          <div key={category.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {category.name}
                </h3>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">範囲:</span> {category.valueRange.min} 〜 {category.valueRange.max}
                  </div>
                  <div>
                    <span className="font-medium">最小単位:</span> {category.minUnit}
                  </div>
                  {category.deadline && (
                    <div>
                      <span className="font-medium">期限:</span>{' '}
                      <span className={getDeadlineColor(category.deadline)}>
                        {formatDate(category.deadline)}
                        {getDaysUntilDeadline(category.deadline) && (
                          <> ({getDaysUntilDeadline(category.deadline)})</>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => onEditCategory(category)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="編集"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  disabled={deletingId === category.id}
                  className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                  title="削除"
                >
                  {deletingId === category.id ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">進捗状況</span>
                <span className="text-sm text-gray-600">
                  {progress.completed} / {progress.total} ブロック ({progress.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between">
                <span>想定ブロック数: {progress.total}</span>
                <span>完了ブロック数: {progress.completed}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CategoryList;