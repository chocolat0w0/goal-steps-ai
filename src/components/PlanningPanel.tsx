import { useState } from 'react';
import { type Project, type Category, type WeeklySettings } from '~/types';
import { usePlanning } from '~/hooks/usePlanning';
import { getTotalUnits } from '~/lib/category';

interface PlanningPanelProps {
  project: Project;
  categories: Category[];
  weeklySettings: WeeklySettings;
  onPlanGenerated: () => void;
}

function PlanningPanel({
  project,
  categories,
  weeklySettings,
  onPlanGenerated,
}: PlanningPanelProps) {
  const { isGenerating, generatePlan, validatePlanningData } = usePlanning();
  const [errors, setErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleGeneratePlan = async () => {
    setErrors([]);

    const result = await generatePlan(project, categories, weeklySettings);

    if (result.success) {
      setShowPreview(true);
      onPlanGenerated();
    } else {
      setErrors(result.errors);
    }
  };

  const handleValidation = () => {
    const validationErrors = validatePlanningData(
      project,
      categories,
      weeklySettings
    );
    setErrors(validationErrors);
  };

  // 統計情報を計算
  const totalUnits = categories.reduce(
    (sum, category) => sum + getTotalUnits(category),
    0
  );

  const projectDeadline = new Date(project.deadline);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysUntilDeadline = (deadline: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">自動計画生成</h3>
          <p className="text-gray-600 mt-1">
            カテゴリーと設定に基づいてタスク計画を自動生成します
          </p>
        </div>
        <button
          onClick={handleValidation}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          設定を確認
        </button>
      </div>

      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            設定に問題があります:
          </h4>
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">総ブロック数</div>
          <div className="text-2xl font-semibold text-gray-900">
            {totalUnits}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">プロジェクト期限</div>
          <div className="text-lg font-semibold text-gray-900">
            {formatDate(projectDeadline)}
          </div>
          <div className="text-sm text-gray-500">
            残り{getDaysUntilDeadline(projectDeadline)}日
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">カテゴリー数</div>
          <div className="text-2xl font-semibold text-gray-900">
            {categories.length}
          </div>
        </div>
      </div>

      {/* カテゴリー詳細 */}
      {categories.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-3">
            カテゴリー詳細
          </h4>
          <div className="space-y-2">
            {categories.map((category) => {
              const units = getTotalUnits(category);
              return (
                <div
                  key={category.id}
                  className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded"
                >
                  <div>
                    <span className="font-medium text-gray-900">
                      {category.name}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      ({category.valueRange.min}-{category.valueRange.max}, 単位
                      {category.minUnit})
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {units} ブロック
                    {category.deadline && (
                      <span className="ml-2 text-orange-600">
                        期限:{' '}
                        {new Date(category.deadline).toLocaleDateString(
                          'ja-JP'
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 計画生成ボタン */}
      <div className="flex justify-center">
        <button
          onClick={handleGeneratePlan}
          disabled={
            isGenerating || categories.length === 0 || errors.length > 0
          }
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <div className="flex items-center">
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
              計画生成中...
            </div>
          ) : (
            '自動計画を生成'
          )}
        </button>
      </div>

      {showPreview && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-green-800 font-medium">
              計画が生成されました！
            </span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            カレンダー表示で詳細なタスクスケジュールを確認できます。
          </p>
        </div>
      )}
    </div>
  );
}

export default PlanningPanel;
