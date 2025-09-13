import { useState } from 'react';
import { type TaskBlock as TaskBlockType, type Category } from '~/types';
import CalendarDay from './CalendarDay';

interface CalendarProps {
  taskBlocks: TaskBlockType[];
  categories: Category[];
  onToggleTaskCompletion: (blockId: string, completed: boolean) => void;
  onMoveTaskBlock: (blockId: string, newDate: string) => void;
}

function Calendar({ taskBlocks, categories, onToggleTaskCompletion, onMoveTaskBlock }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 月の最初の日を取得
  const firstDayOfMonth = new Date(year, month, 1);

  // カレンダーの最初の日（月曜日から開始）
  const startDate = new Date(firstDayOfMonth);
  const dayOfWeek = startDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 月曜日を0とする
  startDate.setDate(startDate.getDate() + mondayOffset);

  // カレンダーの最後の日
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 41); // 6週間分

  // カレンダーの日付配列を生成
  const calendarDays: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    calendarDays.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
    });
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month && date.getFullYear() === year;
  };

  const weekdays = ['月', '火', '水', '木', '金', '土', '日'];

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* カレンダーヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {formatMonth(currentDate)}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            今日
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="前の月"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="次の月"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekdays.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date, index) => (
          <CalendarDay
            key={index}
            date={date}
            taskBlocks={taskBlocks}
            allTaskBlocks={taskBlocks}
            categories={categories}
            onToggleTaskCompletion={onToggleTaskCompletion}
            onMoveTaskBlock={onMoveTaskBlock}
            isToday={isToday(date)}
            isCurrentMonth={isCurrentMonth(date)}
          />
        ))}
      </div>

      {/* 凡例 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span>進捗バー</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>完了</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <span>ドラッグで移動可能</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Calendar;