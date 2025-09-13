import { useState } from 'react';
import { type TaskBlock as TaskBlockType, type Category } from '~/types';
import CalendarDay from './CalendarDay';

type ViewMode = 'month' | 'week';

interface CalendarProps {
  taskBlocks: TaskBlockType[];
  categories: Category[];
  onToggleTaskCompletion: (blockId: string, completed: boolean) => void;
  onMoveTaskBlock: (blockId: string, newDate: string) => void;
}

function Calendar({ taskBlocks, categories, onToggleTaskCompletion, onMoveTaskBlock }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 表示日付を計算
  const getCalendarDays = (): Date[] => {
    if (viewMode === 'week') {
      // 週表示：現在日付を含む週の月曜日から日曜日
      const weekStart = new Date(currentDate);
      const dayOfWeek = weekStart.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      weekStart.setDate(weekStart.getDate() + mondayOffset);
      
      const days: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        days.push(day);
      }
      return days;
    } else {
      // 月表示：従来の6週間表示
      const firstDayOfMonth = new Date(year, month, 1);
      const startDate = new Date(firstDayOfMonth);
      const dayOfWeek = startDate.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate.setDate(startDate.getDate() + mondayOffset);

      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 41); // 6週間分

      const days: Date[] = [];
      const current = new Date(startDate);
      
      while (current <= endDate) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      return days;
    }
  };

  const calendarDays = getCalendarDays();

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatTitle = (date: Date) => {
    if (viewMode === 'week') {
      const weekStart = new Date(date);
      const dayOfWeek = weekStart.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      weekStart.setDate(weekStart.getDate() + mondayOffset);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月 ${weekStart.getDate()}日-${weekEnd.getDate()}日`;
      } else {
        return `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月${weekStart.getDate()}日-${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
      }
    } else {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
      });
    }
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
            {formatTitle(currentDate)}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            今日
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 表示モード切り替え */}
          <div className="flex bg-gray-100 rounded-md p-1 mr-4">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              月
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              週
            </button>
          </div>
          
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title={viewMode === 'week' ? '前の週' : '前の月'}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title={viewMode === 'week' ? '次の週' : '次の月'}
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
            isWeekView={viewMode === 'week'}
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