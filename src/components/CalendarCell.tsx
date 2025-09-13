import { type FC, type MutableRefObject } from 'react';
import type { TaskBlock } from '~/types';

interface Props {
  dateStr: string;
  day: number;
  tasks: TaskBlock[];
  nameMap: Map<string, string>;
  isDragOver: boolean;
  moveMode: boolean;
  draggingId: string | null;
  selectedId: string | null;
  draggingIdRef: MutableRefObject<string | null>;
  selectedIdRef: MutableRefObject<string | null>;
  setDragOverDate: (d: string | null) => void;
  setDraggingId: (id: string | null) => void;
  setSelectedId: (id: string | null) => void;
  onToggleTask?: (id: string) => void;
  onMoveTask?: (id: string, date: string) => void;
  isCurrentMonth?: boolean;
}

const CalendarCell: FC<Props> = ({
  dateStr,
  day,
  tasks,
  nameMap,
  isDragOver,
  moveMode,
  draggingId,
  selectedId,
  draggingIdRef,
  selectedIdRef,
  setDragOverDate,
  setDraggingId,
  setSelectedId,
  onToggleTask,
  onMoveTask,
  isCurrentMonth = true,
}) => {
  const total = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const percent = total ? Math.round((completedCount / total) * 100) : 0;
  return (
    <div
      data-date={dateStr}
      role="gridcell"
      aria-label={dateStr}
      className={`h-24 p-1 overflow-y-auto ${
        isCurrentMonth ? 'bg-white' : 'bg-gray-50'
      } ${isDragOver ? 'ring-2 ring-blue-300' : ''}`}
      onDragOver={(e) => {
        if (draggingIdRef.current) e.preventDefault();
      }}
      onDragEnter={() => {
        if (draggingIdRef.current) setDragOverDate(dateStr);
      }}
      onDragLeave={() => {
        if (draggingIdRef.current && isDragOver) setDragOverDate(null);
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
      <div className="mt-1">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuenow={completedCount}
          aria-valuemax={total}
          className="h-1 w-full rounded bg-gray-200"
        >
          <div className="h-1 rounded bg-green-400" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-1 text-[10px] text-right">
          {completedCount}/{total}
        </div>
      </div>
      {tasks.map((t) => (
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
    </div>
  );
};

export default CalendarCell;
