import { useMemo } from 'react';
import dayjs from 'dayjs';
import { type TaskBlock as TaskBlockType, type Category } from '~/types';
import TaskBlock from './TaskBlock';

interface TodayTasksSectionProps {
  taskBlocks: TaskBlockType[];
  categories: Category[];
  onToggleTaskCompletion: (
    blockId: string,
    completed: boolean
  ) => void | Promise<void>;
}

function TodayTasksSection({
  taskBlocks,
  categories,
  onToggleTaskCompletion,
}: TodayTasksSectionProps) {
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const todayKey = dayjs().format('YYYY-MM-DD');

  const { overdueBlocks, todaysBlocks } = useMemo(() => {
    const today = dayjs(todayKey);

    const sortBlocks = (blocks: TaskBlockType[]) =>
      [...blocks].sort((a, b) => {
        const dateDiff = dayjs(a.date).diff(dayjs(b.date));
        if (dateDiff !== 0) return dateDiff;
        return a.start - b.start;
      });

    const overdue = taskBlocks.filter(
      (block) => !block.completed && dayjs(block.date).isBefore(today, 'day')
    );

    const todays = taskBlocks.filter((block) =>
      dayjs(block.date).isSame(today, 'day')
    );

    return {
      overdueBlocks: sortBlocks(overdue),
      todaysBlocks: sortBlocks(todays),
    };
  }, [taskBlocks, todayKey]);

  const totalTasksCount = overdueBlocks.length + todaysBlocks.length;
  const completedCount = todaysBlocks.filter((block) => block.completed).length;

  const getCategory = (categoryId: string) =>
    categories.find((category) => category.id === categoryId);

  const formatDateLabel = (dateString: string) => {
    const date = dayjs(dateString);
    return `${date.format('M/D')} (${dayNames[date.day()]})`;
  };

  const renderTask = (block: TaskBlockType, { showDate }: { showDate: boolean }) => {
    const category = getCategory(block.categoryId);

    if (!category) {
      return null;
    }

    return (
      <div key={block.id} className="flex flex-col min-w-[180px]">
        {showDate && (
          <div className="text-xs text-gray-500 pl-1 mb-1">
            予定日: {formatDateLabel(block.date)}
          </div>
        )}
        <TaskBlock
          block={block}
          category={category}
          onToggleCompletion={(blockId, completed) => {
            void onToggleTaskCompletion(blockId, completed);
          }}
          isCompact={true}
        />
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center border-b border-gray-200 p-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">今日のやること</h2>
          <p className="text-gray-600 mt-1 text-sm">
            未完了の過去タスクと本日予定のタスクをまとめて確認しましょう
          </p>
        </div>
        {totalTasksCount > 0 && (
          <div className="text-sm text-gray-600">
            完了: {completedCount} / {totalTasksCount}
          </div>
        )}
      </div>

      <div className="p-4 space-y-6">
        {totalTasksCount === 0 ? (
          <div className="text-sm text-gray-500">
            本日に対応するタスクはありません。
          </div>
        ) : (
          <>
            {overdueBlocks.length > 0 && (
              <div>
                <div className="flex items-center text-sm font-semibold text-red-600">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  未完了のタスク（〜昨日）
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {overdueBlocks.map((block) =>
                    renderTask(block, { showDate: true })
                  )}
                </div>
              </div>
            )}

            {todaysBlocks.length > 0 && (
              <div>
                <div className="flex items-center text-sm font-semibold text-blue-600">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10m-12 8h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  今日のタスク
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {todaysBlocks.map((block) =>
                    renderTask(block, { showDate: false })
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TodayTasksSection;
