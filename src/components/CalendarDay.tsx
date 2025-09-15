import { useEffect, useState } from 'react';
import { type TaskBlock as TaskBlockType, type Category } from '~/types';
import TaskBlock from './TaskBlock';
import Fireworks from './Fireworks';
import dayjs from 'dayjs';

interface CalendarDayProps {
  date: Date;
  taskBlocks: TaskBlockType[];
  categories: Category[];
  onToggleTaskCompletion: (blockId: string, completed: boolean) => void;
  onMoveTaskBlock: (blockId: string, newDate: string) => void;
  isToday?: boolean;
  isCurrentMonth?: boolean;
  isWeekView?: boolean;
}

function CalendarDay({
  date,
  taskBlocks,
  categories,
  onToggleTaskCompletion,
  onMoveTaskBlock,
  isToday = false,
  isCurrentMonth = true,
  isWeekView = false,
}: CalendarDayProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  const dateString = dayjs(date).format('YYYY-MM-DD');
  const dayTaskBlocks = taskBlocks.filter((block) => block.date === dateString);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (!e.dataTransfer) {
      return;
    }

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { blockId, originalDate } = data;

      if (originalDate !== dateString) {
        onMoveTaskBlock(blockId, dateString);
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
  };

  const getCategoryById = (categoryId: string): Category | undefined => {
    return categories.find((cat) => cat.id === categoryId);
  };

  const completedCount = dayTaskBlocks.filter(
    (block) => block.completed
  ).length;
  const totalCount = dayTaskBlocks.length;
  const completionPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  useEffect(() => {
    if (isToday && totalCount > 0 && completedCount === totalCount) {
      setShowFireworks(true);
      const timer = setTimeout(() => setShowFireworks(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [completedCount, totalCount, isToday]);

  const dayClasses = `
    ${isWeekView ? 'min-h-[200px]' : 'min-h-[120px]'} p-2 border border-gray-200 bg-white relative
    ${isCurrentMonth ? '' : 'bg-gray-50 text-gray-400'}
    ${isToday ? 'bg-blue-50 border-blue-300' : ''}
    ${isDragOver ? 'bg-green-50 border-green-400 border-dashed' : ''}
    ${totalCount > 0 ? 'hover:shadow-sm' : ''}
    transition-all duration-200
  `;

  return (
    <div
      className={dayClasses}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 日付表示 */}
      <div className="flex justify-between items-start mb-2">
        <span
          className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}
        >
          {date.getDate()}
        </span>
        {totalCount > 0 && (
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-sm text-gray-600">
              {completedCount}/{totalCount}
            </span>
            {completionPercentage === 100 && (
              <svg
                className="w-3 h-3 text-green-600"
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
            )}
          </div>
        )}
      </div>

      {/* 進捗バー */}
      {totalCount > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
          <div
            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      )}

      {/* タスクブロック */}
      <div
        className={`space-y-1 ${isWeekView ? '' : 'max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'}`}
      >
        {dayTaskBlocks.map((taskBlock) => {
          const category = getCategoryById(taskBlock.categoryId);
          if (!category) return null;

          return (
            <TaskBlock
              key={taskBlock.id}
              taskBlock={taskBlock}
              category={category}
              onToggleCompletion={onToggleTaskCompletion}
              isDragging={false}
              isDroppable={isDragOver}
            />
          );
        })}
      </div>

      {/* ドラッグオーバー時のメッセージ */}
      {isDragOver && dayTaskBlocks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-green-600 text-xs font-medium bg-green-100 px-2 py-1 rounded">
            ここに移動
          </div>
        </div>
      )}

      {/* 今日の表示 */}
      {isToday && (
        <div className="absolute top-1 left-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
        </div>
      )}

      {showFireworks && <Fireworks />}
    </div>
  );
}

export default CalendarDay;
