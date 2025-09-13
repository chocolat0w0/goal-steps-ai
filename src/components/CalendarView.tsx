import { useState, useMemo, useEffect, useRef, type FC } from 'react';
import type { TaskBlock, Category } from '~/types';
import CalendarCell from './CalendarCell';

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const formatDate = (year: number, month: number, day: number) => {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

const DAY_NAMES = ['月', '火', '水', '木', '金', '土', '日'] as const;

interface Props {
  tasks: TaskBlock[];
  categories: Category[];
  initialDate?: Date;
  onToggleTask?: (id: string) => void;
  onMoveTask?: (id: string, date: string) => void;
}

const CalendarView: FC<Props> = ({ tasks, categories, initialDate, onToggleTask, onMoveTask }) => {
  const [current, setCurrent] = useState(() => initialDate ?? new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [moveMode, setMoveMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!draggingId) return;

    const handleMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      e.preventDefault();
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const cell = el?.closest('[data-date]') as HTMLDivElement | null;
      const date = cell?.getAttribute('data-date');
      setDragOverDate(date ?? null);
    };

    const handleEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (!touch) return;
      e.preventDefault();
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const cell = el?.closest('[data-date]') as HTMLDivElement | null;
      const date = cell?.getAttribute('data-date');
      const id = draggingIdRef.current;
      if (date && id) onMoveTask?.(id, date);
      draggingIdRef.current = null;
      setDraggingId(null);
      setDragOverDate(null);
    };

    const handleCancel = () => {
      draggingIdRef.current = null;
      setDraggingId(null);
      setDragOverDate(null);
    };

    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    document.addEventListener('touchcancel', handleCancel);
    return () => {
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('touchcancel', handleCancel);
    };
  }, [draggingId, onMoveTask]);

  useEffect(() => {
    if (moveMode) {
      draggingIdRef.current = null;
      setDraggingId(null);
      setDragOverDate(null);
    }
  }, [moveMode]);

  const nameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.id, c.name);
    return map;
  }, [categories]);

  const year = current.getFullYear();
  const month = current.getMonth();

  const prev = () => {
    if (view === 'month') setCurrent(new Date(year, month - 1, 1));
    else setCurrent(new Date(year, month, current.getDate() - 7));
  };
  const next = () => {
    if (view === 'month') setCurrent(new Date(year, month + 1, 1));
    else setCurrent(new Date(year, month, current.getDate() + 7));
  };
  const goToday = () => {
    const t = new Date();
    setCurrent(t);
  };
  const toggleView = () => setView((v) => (v === 'month' ? 'week' : 'month'));
  const toggleMoveMode = () => {
    setMoveMode((prev) => {
      if (prev) {
        setSelectedId(null);
        selectedIdRef.current = null;
      }
      return !prev;
    });
  };

  const grouped: Record<string, TaskBlock[]> = {};
  for (const t of tasks) {
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date].push(t);
  }

  let dates: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];
  if (view === 'month') {
    const days = daysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = (firstDay + 6) % 7;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthIndex = month === 0 ? 11 : month - 1;
    const prevDays = daysInMonth(prevYear, prevMonthIndex);
    const preDates = Array.from({ length: startOffset }, (_, i) => {
      const day = prevDays - startOffset + i + 1;
      const dateStr = formatDate(prevYear, prevMonthIndex, day);
      return { day, dateStr, isCurrentMonth: false };
    });
    const dayDates = Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      const dateStr = formatDate(year, month, day);
      return { day, dateStr, isCurrentMonth: true };
    });
    const totalCells = startOffset + days;
    const endOffset = (7 - (totalCells % 7)) % 7;
    const nextYear = month === 11 ? year + 1 : year;
    const nextMonthIndex = month === 11 ? 0 : month + 1;
    const postDates = Array.from({ length: endOffset }, (_, i) => {
      const day = i + 1;
      const dateStr = formatDate(nextYear, nextMonthIndex, day);
      return { day, dateStr, isCurrentMonth: false };
    });
    dates = [...preDates, ...dayDates, ...postDates];
  } else {
    const weekStart = new Date(current);
    const offset = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - offset);
    dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return {
        day: d.getDate(),
        dateStr: formatDate(d.getFullYear(), d.getMonth(), d.getDate()),
        isCurrentMonth: d.getMonth() === month,
      };
    });
  }

  const title =
    view === 'month'
      ? `${year}年${month + 1}月`
      : (() => {
          const start = new Date(dates[0].dateStr);
          const end = new Date(dates[6].dateStr);
          return `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日〜${end.getFullYear()}年${end.getMonth() + 1}月${end.getDate()}日`;
        })();

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm mt-8" aria-label="カレンダービュー">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-semibold">{title}</div>
        <div className="space-x-2">
          <button
            type="button"
            onClick={prev}
            aria-label={view === 'month' ? '前の月' : '前の週'}
            className="rounded bg-gray-100 px-2 py-1 hover:bg-gray-200"
          >
            前
          </button>
          <button
            type="button"
            onClick={goToday}
            aria-label="今日"
            className="rounded bg-gray-100 px-2 py-1 hover:bg-gray-200"
          >
            今日
          </button>
          <button
            type="button"
            onClick={next}
            aria-label={view === 'month' ? '次の月' : '次の週'}
            className="rounded bg-gray-100 px-2 py-1 hover:bg-gray-200"
          >
            次
          </button>
          <button
            type="button"
            onClick={toggleView}
            aria-label={view === 'month' ? '週表示' : '月表示'}
            className="rounded bg-gray-100 px-2 py-1 hover:bg-gray-200"
          >
            {view === 'month' ? '週表示' : '月表示'}
          </button>
          <button
            type="button"
            onClick={toggleMoveMode}
            aria-label="タスク移動モード"
            className={`rounded bg-gray-100 px-2 py-1 hover:bg-gray-200 ${moveMode ? 'bg-blue-100' : ''}`}
          >
            {moveMode ? '移動中' : '移動モード'}
          </button>
        </div>
      </div>
      <div className="mb-1 grid grid-cols-7 text-center text-sm font-semibold" role="row">
        {DAY_NAMES.map((d) => (
          <div key={d} role="columnheader" aria-label={`${d}曜日`}>
            {d}
          </div>
        ))}
      </div>
      <div role="grid" className="grid grid-cols-7 gap-px bg-gray-200">
        {dates.map(({ day, dateStr, isCurrentMonth }) => (
          <CalendarCell
            key={dateStr}
            dateStr={dateStr}
            day={day}
            tasks={grouped[dateStr] || []}
            nameMap={nameMap}
            isDragOver={dragOverDate === dateStr}
            moveMode={moveMode}
            draggingId={draggingId}
            selectedId={selectedId}
            draggingIdRef={draggingIdRef}
            selectedIdRef={selectedIdRef}
            setDragOverDate={setDragOverDate}
            setDraggingId={setDraggingId}
            setSelectedId={setSelectedId}
            onToggleTask={onToggleTask}
            onMoveTask={onMoveTask}
            isCurrentMonth={isCurrentMonth}
          />
        ))}
      </div>
    </section>
  );
};

export default CalendarView;
