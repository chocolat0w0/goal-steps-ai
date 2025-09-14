import { useState } from 'react';
import { type WeeklySettings, type WeeklyDistribution } from '~/types';
import {
  getAllDayKeys,
  getDayOfWeekName,
  getWorkingDaysCount,
  getTotalWeeklyCapacity,
} from '~/lib/weeklySettings';

interface WeeklySettingsFormProps {
  settings: WeeklySettings;
  onUpdateDayDistribution: (
    day: keyof Omit<WeeklySettings, 'projectId'>,
    distribution: WeeklyDistribution
  ) => Promise<WeeklySettings | null>;
  onResetToDefault: () => Promise<WeeklySettings | null>;
}

const DISTRIBUTION_OPTIONS: {
  value: WeeklyDistribution;
  label: string;
  color: string;
}[] = [
  { value: 'high', label: '多め', color: 'bg-green-500' },
  { value: 'normal', label: '普通', color: 'bg-blue-500' },
  { value: 'low', label: '少なめ', color: 'bg-yellow-500' },
  { value: 'none', label: 'なし', color: 'bg-gray-400' },
];

function WeeklySettingsForm({
  settings,
  onUpdateDayDistribution,
  onResetToDefault,
}: WeeklySettingsFormProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dayKeys = getAllDayKeys();

  const handleDistributionChange = async (
    day: keyof Omit<WeeklySettings, 'projectId'>,
    distribution: WeeklyDistribution
  ) => {
    setError(null);
    setUpdating(day);

    try {
      const result = await onUpdateDayDistribution(day, distribution);
      if (!result) {
        setError('設定の更新に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setUpdating(null);
    }
  };

  const handleResetToDefault = async () => {
    if (!confirm('設定をデフォルトに戻しますか？')) {
      return;
    }

    setError(null);
    setUpdating('reset');

    try {
      const result = await onResetToDefault();
      if (!result) {
        setError('設定のリセットに失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setUpdating(null);
    }
  };

  const getDistributionColor = (distribution: WeeklyDistribution): string => {
    const option = DISTRIBUTION_OPTIONS.find(
      (opt) => opt.value === distribution
    );
    return option?.color || 'bg-gray-400';
  };

  const workingDaysCount = getWorkingDaysCount(settings);
  const totalCapacity = getTotalWeeklyCapacity(settings);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            曜日別配分設定
          </h3>
          <p className="text-gray-600 mt-1">各曜日の作業量を調整できます</p>
        </div>
        <button
          onClick={handleResetToDefault}
          disabled={updating === 'reset'}
          className="text-sm text-gray-600 hover:text-gray-800 underline disabled:opacity-50"
        >
          {updating === 'reset' ? 'リセット中...' : 'デフォルトに戻す'}
        </button>
      </div>

      {error && (
        <div className="mb-6 text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {dayKeys.map((dayKey) => {
          const dayName = getDayOfWeekName(dayKey);
          const currentDistribution = settings[dayKey] as WeeklyDistribution;
          const isUpdating = updating === dayKey;

          return (
            <div key={dayKey} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{dayName}</h4>
                <div
                  className={`w-3 h-3 rounded-full ${getDistributionColor(currentDistribution)}`}
                ></div>
              </div>

              <div className="space-y-2">
                {DISTRIBUTION_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`${dayKey}-distribution`}
                      value={option.value}
                      checked={currentDistribution === option.value}
                      onChange={() =>
                        handleDistributionChange(dayKey, option.value)
                      }
                      disabled={isUpdating}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full ${option.color} mr-2`}
                      ></div>
                      <span className="text-sm text-gray-700">
                        {option.label}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              {isUpdating && (
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <div className="w-3 h-3 animate-spin rounded-full border border-gray-300 border-t-blue-600 mr-2"></div>
                  更新中...
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">設定サマリー</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">作業予定日数:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {workingDaysCount}日/週
            </span>
          </div>
          <div>
            <span className="text-gray-600">週間総容量:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {totalCapacity.toFixed(1)}単位
            </span>
          </div>
          <div>
            <span className="text-gray-600">平均日別容量:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {workingDaysCount > 0
                ? (totalCapacity / workingDaysCount).toFixed(1)
                : 0}
              単位
            </span>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>• 多め: 通常の1.5倍の作業量を割り当てます</p>
          <p>• 普通: 通常の1倍の作業量を割り当てます</p>
          <p>• 少なめ: 通常の0.5倍の作業量を割り当てます</p>
          <p>• なし: その日は作業を行いません</p>
        </div>
      </div>
    </div>
  );
}

export default WeeklySettingsForm;
