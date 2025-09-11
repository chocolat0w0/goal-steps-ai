import { useState, useMemo, type FC, type ReactElement } from 'react';
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
}

const CalendarView: FC<Props> = ({ tasks, categories, initialDate }) => {
  const [current, setCurrent] = useState(() => {
    const d = initialDate ?? new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

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

  const grouped: Record<string, TaskBlock[]> = {};
  for (const t of tasks) {
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date].push(t);
  }

  const cells: ReactElement[] = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push(
      <div key={`pre-${i}`} role="gridcell" className="h-24 border bg-gray-50" aria-hidden="true" />,
    );
  }

  for (let day = 1; day <= days; day++) {
    const dateStr = formatDate(year, month, day);
    const ts = grouped[dateStr] || [];
    cells.push(
      <div
        key={dateStr}
        role="gridcell"
        aria-label={dateStr}
        className="h-24 border p-1 overflow-y-auto bg-white"
      >
        <div className="text-xs">{day}</div>
        {ts.map((t) => (
          <div key={t.id} data-testid="task-block" className="mt-1 rounded bg-blue-100 p-1 text-xs">
            {nameMap.get(t.categoryId) ?? t.categoryId}: {t.amount}
          </div>
        ))}
      </div>,
    );
  }

  const totalCells = cells.length;
  const endOffset = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < endOffset; i++) {
    cells.push(
      <div key={`post-${i}`} role="gridcell" className="h-24 border bg-gray-50" aria-hidden="true" />,
    );
  }

  return (
    <section className="rounded-lg border bg-white p-6 shadow-sm mt-8" aria-label="カレンダービュー">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-semibold">
          {year}年{month + 1}月
        </div>
        <div className="space-x-2">
          <button type="button" onClick={prevMonth} aria-label="前の月" className="px-2 py-1 border rounded">
            前
          </button>
          <button type="button" onClick={goToday} aria-label="今日" className="px-2 py-1 border rounded">
            今日
          </button>
          <button type="button" onClick={nextMonth} aria-label="次の月" className="px-2 py-1 border rounded">
            次
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
      <div role="grid" className="grid grid-cols-7 gap-px bg-gray-300">
        {cells}
      </div>
    </section>
  );
};

export default CalendarView;
