import { useMemo, useImperativeHandle, forwardRef } from 'react';
import { type TaskBlock as TaskBlockType, type Category } from '~/types';
import TaskBlock from './TaskBlock';
import dayjs from 'dayjs';

interface ContinuousViewProps {
  taskBlocks: TaskBlockType[];
  categories: Category[];
  onToggleTaskCompletion: (blockId: string, completed: boolean) => void;
  onMoveTaskBlock: (blockId: string, newDate: string) => void;
  projectStartDate?: string;
  projectEndDate?: string;
}

export interface ContinuousViewRef {
  scrollToToday: () => void;
}

const ContinuousView = forwardRef<ContinuousViewRef, ContinuousViewProps>(
  (
    {
      taskBlocks,
      categories,
      onToggleTaskCompletion,
      onMoveTaskBlock,
      projectStartDate,
      projectEndDate,
    },
    ref
  ) => {
    // 今日の日付を固定化（useMemo依存関係を安定化）
    const today = useMemo(() => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      return date;
    }, []);

    // 連続日付リストを生成（プロジェクト期間ベース）
    const getDatesInRange = useMemo(() => {
      const dates: Date[] = [];

      // プロジェクト開始日と終了日が指定されている場合はその期間を使用
      let startDate: Date;
      let endDate: Date;

      if (projectStartDate && projectEndDate) {
        startDate = new Date(projectStartDate);
        endDate = new Date(projectEndDate);
      } else {
        // デフォルトは今日から前後30日
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 30);
      }

      const current = new Date(startDate);
      while (current <= endDate) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      return dates;
    }, [projectStartDate, projectEndDate, today]);

    const scrollToToday = () => {
      const todayElement = document.getElementById('today-row');
      if (todayElement) {
        todayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    useImperativeHandle(ref, () => ({
      scrollToToday,
    }));

    // 日付ごとのタスクブロックを整理
    const taskBlocksByDate = useMemo(() => {
      const grouped: Record<string, TaskBlockType[]> = {};

      taskBlocks.forEach((block) => {
        const dateKey = block.date;
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(block);
      });

      return grouped;
    }, [taskBlocks]);

    // 日付フォーマット
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
      const dayName = dayNames[date.getDay()];

      return {
        dateString: `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`,
        dayName,
        isToday: dayjs(date).isSame(dayjs(today), 'day'),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      };
    };

    // カテゴリー情報を取得
    const getCategoryInfo = (categoryId: string) => {
      return categories.find((cat) => cat.id === categoryId);
    };

    const handleDrop = (e: React.DragEvent, targetDate: string) => {
      e.preventDefault();
      const blockId = e.dataTransfer.getData('text/plain');
      if (blockId) {
        onMoveTaskBlock(blockId, targetDate);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
    };

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1">
          {getDatesInRange.map((date) => {
            const dateInfo = formatDate(date);
            const dateKey = dayjs(date).format('YYYY-MM-DD');
            const dayTasks = taskBlocksByDate[dateKey] || [];

            return (
              <div
                key={dateKey}
                id={dateInfo.isToday ? 'today-row' : undefined}
                className={`flex items-start border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  dateInfo.isToday ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onDrop={(e) => handleDrop(e, dateKey)}
                onDragOver={handleDragOver}
              >
                {/* 日付部分 */}
                <div
                  className={`flex-shrink-0 w-32 p-3 text-center border-r border-gray-200 ${
                    dateInfo.isWeekend ? 'bg-red-50' : 'bg-gray-50'
                  }`}
                >
                  <div
                    className={`text-sm font-medium ${
                      dateInfo.isToday
                        ? 'text-blue-700'
                        : dateInfo.isWeekend
                          ? 'text-red-600'
                          : 'text-gray-700'
                    }`}
                  >
                    {dateInfo.dateString}
                  </div>
                  <div
                    className={`text-xs ${
                      dateInfo.isToday
                        ? 'text-blue-600'
                        : dateInfo.isWeekend
                          ? 'text-red-500'
                          : 'text-gray-500'
                    }`}
                  >
                    ({dateInfo.dayName})
                  </div>
                  {dateInfo.isToday && (
                    <div className="text-xs text-blue-600 font-medium mt-1">
                      今日
                    </div>
                  )}
                </div>

                {/* タスクブロック部分 */}
                <div className="flex-1 p-3">
                  {dayTasks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {dayTasks.map((block) => {
                        const category = getCategoryInfo(block.categoryId);
                        return (
                          <div key={block.id} className="flex-shrink-0">
                            <TaskBlock
                              block={block}
                              category={category}
                              onToggleCompletion={onToggleTaskCompletion}
                              allTaskBlocks={taskBlocks}
                              isCompact={true}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm italic">
                      タスクなし
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

ContinuousView.displayName = 'ContinuousView';

export default ContinuousView;
