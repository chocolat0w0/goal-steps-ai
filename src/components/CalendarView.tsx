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
  const [current, setCurrent] = useState(() => {
    const d = initialDate ?? new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
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
  const days = daysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1));
  const goToday = () => {
    const t = new Date();
    setCurrent(new Date(t.getFullYear(), t.getMonth(), 1));
  };
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

  const prevYear = month === 0 ? year - 1 : year;
  const prevMonthIndex = month === 0 ? 11 : month - 1;
  const prevDays = daysInMonth(prevYear, prevMonthIndex);
  const preDates = Array.from({ length: startOffset }, (_, i) => {
    const day = prevDays - startOffset + i + 1;
    const dateStr = formatDate(prevYear, prevMonthIndex, day);
    return { day, dateStr };
  });

  const dayDates = Array.from({ length: days }, (_, i) => {
    const day = i + 1;
    const dateStr = formatDate(year, month, day);
    return { day, dateStr };
  });

  const totalCells = startOffset + days;
  const endOffset = (7 - (totalCells % 7)) % 7;
  const nextYear = month === 11 ? year + 1 : year;
  const nextMonthIndex = month === 11 ? 0 : month + 1;
  const postDates = Array.from({ length: endOffset }, (_, i) => {
    const day = i + 1;
    const dateStr = formatDate(nextYear, nextMonthIndex, day);
    return { day, dateStr };
  });

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm mt-8" aria-label="カレンダービュー">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-semibold">
          {year}年{month + 1}月
        </div>
        <div className="space-x-2">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="前の月"
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
            onClick={nextMonth}
            aria-label="次の月"
            className="rounded bg-gray-100 px-2 py-1 hover:bg-gray-200"
          >
            次
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
        {preDates.map(({ day, dateStr }) => (
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
            isCurrentMonth={false}
          />
        ))}
        {dayDates.map(({ day, dateStr }) => (
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
          />
        ))}
        {postDates.map(({ day, dateStr }) => (
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
            isCurrentMonth={false}
          />
        ))}
      </div>
    </section>
  );
};

export default CalendarView;
