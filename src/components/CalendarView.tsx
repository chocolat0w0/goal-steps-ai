import {
  useState,
  useMemo,
  useEffect,
  useRef,
  type FC,
  type ReactElement,
} from 'react';
import type { TaskBlock, Category } from '~/types';

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

  const cells: ReactElement[] = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push(
      <div key={`pre-${i}`} role="gridcell" className="h-24 bg-gray-50" aria-hidden="true" />,
    );
  }

  for (let day = 1; day <= days; day++) {
    const dateStr = formatDate(year, month, day);
    const ts = grouped[dateStr] || [];
    cells.push(
      <div
        key={dateStr}
        data-date={dateStr}
        role="gridcell"
        aria-label={dateStr}
        className={`h-24 p-1 overflow-y-auto bg-white ${
          dragOverDate === dateStr ? 'ring-2 ring-blue-300' : ''
        }`}
        onDragOver={(e) => {
          if (draggingIdRef.current) e.preventDefault();
        }}
        onDragEnter={() => {
          if (draggingIdRef.current) setDragOverDate(dateStr);
        }}
        onDragLeave={() => {
          if (draggingIdRef.current && dragOverDate === dateStr) setDragOverDate(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          const id = draggingIdRef.current || e.dataTransfer.getData('text/plain');
          if (id) onMoveTask?.(id, dateStr);
          draggingIdRef.current = null;
          setDraggingId(null);
          setDragOverDate(null);
        }}
        onClick={() => {
          const id = selectedIdRef.current;
          if (moveMode && id) {
            onMoveTask?.(id, dateStr);
            selectedIdRef.current = null;
            setSelectedId(null);
          }
        }}
      >
        <div className="text-xs">{day}</div>
        {ts.map((t) => (
          <div
            key={t.id}
            data-testid="task-block"
            draggable={!t.completed && !moveMode}
            onDragStart={(e) => {
              if (moveMode || t.completed) return;
              e.dataTransfer.setData('text/plain', t.id);
              draggingIdRef.current = t.id;
              setDraggingId(t.id);
            }}
            onDragEnd={() => {
              draggingIdRef.current = null;
              setDraggingId(null);
              setDragOverDate(null);
            }}
            onTouchStart={(e) => {
              if (moveMode || t.completed) return;
              e.stopPropagation();
              draggingIdRef.current = t.id;
              setDraggingId(t.id);
            }}
            onClick={(e) => {
              if (!moveMode) return;
              e.stopPropagation();
              if (t.completed) return;
              selectedIdRef.current = t.id;
              setSelectedId(t.id);
            }}
            className={`mt-1 rounded p-1 text-xs ${
              t.completed ? 'bg-green-100 opacity-50' : 'bg-blue-100'
            } ${
              draggingId === t.id
                ? 'rotate-2 ring-2 ring-blue-300'
                : selectedId === t.id
                  ? 'ring-2 ring-blue-300'
                  : ''
            }`}
          >
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={t.completed}
                disabled={moveMode}
                onChange={() => onToggleTask?.(t.id)}
                aria-label="完了"
              />
              <span className={t.completed ? 'line-through' : undefined}>
                {nameMap.get(t.categoryId) ?? t.categoryId}: {t.amount}
              </span>
            </label>
          </div>
        ))}
      </div>,
    );
  }

  const totalCells = cells.length;
  const endOffset = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < endOffset; i++) {
    cells.push(
      <div
        key={`post-${i}`}
        role="gridcell"
        className="h-24 bg-gray-50"
        aria-hidden="true"
      />,
    );
  }

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
        {cells}
      </div>
    </section>
  );
};

export default CalendarView;
