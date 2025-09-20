import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type Category } from '~/types';
import { useProjects } from '~/hooks/useProjects';
import { useCategories } from '~/hooks/useCategories';
import { useWeeklySettings } from '~/hooks/useWeeklySettings';
import { useTaskBlocks } from '~/hooks/useTaskBlocks';
import CategoryList from '~/components/CategoryList';
import CategoryForm from '~/components/CategoryForm';
import WeeklySettingsForm from '~/components/WeeklySettingsForm';
import PlanningPanel from '~/components/PlanningPanel';
import Calendar from '~/components/Calendar';
import Modal from '~/components/Modal';

function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects } = useProjects();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const project = projects.find(p => p.id === id);

  const {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryProgress,
  } = useCategories(id || '');

  const {
    settings: weeklySettings,
    loading: weeklyLoading,
    updateDayDistribution,
    resetToDefault,
  } = useWeeklySettings(id || '');

  const {
    taskBlocks,
    loading: taskBlocksLoading,
    toggleTaskCompletion,
    moveTaskBlock,
    refreshTaskBlocks,
  } = useTaskBlocks(id || '');

  if (!project) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            プロジェクトが見つかりません
          </h2>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            プロジェクト一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  const handleCreateCategory = async (
    name: string,
    valueRange: { min: number; max: number },
    deadline: string | undefined,
    minUnit: number
  ) => {
    const result = await createCategory(name, valueRange, deadline, minUnit);
    if (result) {
      setIsCreateModalOpen(false);
    }
    return result;
  };

  const handleEditCategory = async (
    name: string,
    valueRange: { min: number; max: number },
    deadline: string | undefined,
    minUnit: number
  ) => {
    if (!editingCategory) return null;

    const result = await updateCategory(editingCategory.id, {
      name,
      valueRange,
      deadline,
      minUnit,
    });
    if (result) {
      setEditingCategory(null);
    }
    return result;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysUntilDeadline = (deadline: string) => {
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

  const getOverallProgress = () => {
    if (categories.length === 0)
      return { completed: 0, total: 0, percentage: 0 };

    const totalProgress = categories.reduce(
      (acc, category) => {
        const progress = getCategoryProgress(category);
        acc.completed += progress.completed;
        acc.total += progress.total;
        return acc;
      },
      { completed: 0, total: 0 }
    );

    return {
      ...totalProgress,
      percentage:
        totalProgress.total > 0
          ? Math.round((totalProgress.completed / totalProgress.total) * 100)
          : 0,
    };
  };

  const overallProgress = getOverallProgress();

  if (loading || weeklyLoading || taskBlocksLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            プロジェクト一覧に戻る
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {project.name}
            </h1>
            <div className="space-y-2 text-gray-600">
              <div>
                <span className="font-medium">期限:</span>{' '}
                {formatDate(project.deadline)}
              </div>
              <div>
                <span className="font-medium">残り日数:</span>{' '}
                <span className="font-semibold text-blue-600">
                  {getDaysUntilDeadline(project.deadline)}
                </span>
              </div>
              <div>
                <span className="font-medium">カテゴリー数:</span>{' '}
                {categories.length}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              全体進捗
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>完了ブロック数</span>
                <span>
                  {overallProgress.completed} / {overallProgress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress.percentage}%` }}
                ></div>
              </div>
              <div className="text-center text-sm text-gray-600">
                {overallProgress.percentage}% 完了
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* カテゴリー管理セクション */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">カテゴリー</h2>
            <p className="text-gray-600 mt-2">
              目標を達成するためのカテゴリーを管理しましょう
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            カテゴリー追加
          </button>
        </div>

        <CategoryList
          categories={categories}
          onEditCategory={setEditingCategory}
          onDeleteCategory={deleteCategory}
          getCategoryProgress={getCategoryProgress}
        />
      </div>

      {/* 曜日別配分設定セクション */}
      {weeklySettings && (
        <div>
          <WeeklySettingsForm
            settings={weeklySettings}
            onUpdateDayDistribution={updateDayDistribution}
            onResetToDefault={resetToDefault}
          />
        </div>
      )}

      {/* 自動計画生成セクション */}
      {weeklySettings && (
        <div>
          <PlanningPanel
            project={project}
            categories={categories}
            weeklySettings={weeklySettings}
            onPlanGenerated={() => {
              refreshTaskBlocks();
              setShowCalendar(true);
            }}
          />
        </div>
      )}

      {/* カレンダー表示セクション */}
      {(taskBlocks.length > 0 || showCalendar) && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                タスクカレンダー
              </h2>
              <p className="text-gray-600 mt-2">
                生成された計画を確認し、ドラッグ&ドロップで調整できます
              </p>
            </div>
            {taskBlocks.length > 0 && (
              <div className="text-sm text-gray-600">
                総タスク数: {taskBlocks.length} | 完了:{' '}
                {taskBlocks.filter((b) => b.completed).length}
              </div>
            )}
          </div>

          <Calendar
            taskBlocks={taskBlocks}
            categories={categories}
            onToggleTaskCompletion={async (blockId, completed) => {
              await toggleTaskCompletion(blockId, completed);
            }}
            onMoveTaskBlock={async (blockId, newDate) => {
              await moveTaskBlock(blockId, newDate);
            }}
            projectStartDate={project.startDate}
            projectEndDate={project.deadline}
          />
        </div>
      )}

      {/* カテゴリー作成モーダル */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="新規カテゴリー作成"
      >
        <CategoryForm
          onSubmit={handleCreateCategory}
          onCancel={() => setIsCreateModalOpen(false)}
          projectDeadline={project.deadline}
        />
      </Modal>

      {/* カテゴリー編集モーダル */}
      <Modal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title="カテゴリー編集"
      >
        {editingCategory && (
          <CategoryForm
            category={editingCategory}
            onSubmit={handleEditCategory}
            onCancel={() => setEditingCategory(null)}
            submitButtonText="更新"
            projectDeadline={project.deadline}
          />
        )}
      </Modal>
    </div>
  );
}

export default ProjectDetailPage;
