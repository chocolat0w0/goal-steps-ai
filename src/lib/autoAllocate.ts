import type { Category, TaskBlock } from '~/types';

const CAT_KEY = 'goal-steps:categories';
const PROJ_KEY = 'goal-steps:project-settings';
const TASK_KEY = 'goal-steps:tasks';
const WEEK_KEY = 'goal-steps:weekday-settings';

const uid = () => Math.random().toString(36).slice(2, 10);

const weightMap: Record<string, number> = {
  more: 1.5,
  normal: 1,
  less: 0.5,
  none: 0,
};

const defaultWeek: Record<number, number> = {
  0: 1,
  1: 1,
  2: 1,
  3: 1,
  4: 1,
  5: 1,
  6: 1,
};

function loadWeekWeights(): Record<number, number> {
  const raw = localStorage.getItem(WEEK_KEY);
  if (!raw) return defaultWeek;
  try {
    const parsed = JSON.parse(raw) as Record<string, keyof typeof weightMap>;
    const weights: Record<number, number> = { ...defaultWeek };
    for (let i = 0; i < 7; i++) {
      const key = String(i);
      if (parsed[key] && weightMap[parsed[key]]) {
        weights[i] = weightMap[parsed[key]];
      }
    }
    return weights;
  } catch {
    return defaultWeek;
  }
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function autoAllocateTasks(today = new Date()): TaskBlock[] {
  const categories = JSON.parse(localStorage.getItem(CAT_KEY) || '[]') as Category[];
  const project = JSON.parse(localStorage.getItem(PROJ_KEY) || '{}') as { deadline?: string };
  if (!project.deadline) return [];
  const weekWeights = loadWeekWeights();
  const tasks: TaskBlock[] = [];
  const start = new Date(formatDate(today));

  for (const c of categories) {
    const deadline = c.deadline && c.deadline < project.deadline ? c.deadline : project.deadline;
    const end = new Date(deadline);
    const days: string[] = [];
    const d = new Date(start);
    while (d <= end) {
      const w = weekWeights[d.getDay()];
      if (w > 0) days.push(formatDate(d));
      d.setDate(d.getDate() + 1);
    }
    if (days.length === 0) continue;

    const weightedDays: string[] = [];
    for (const day of days) {
      const dow = new Date(day).getDay();
      const w = weekWeights[dow];
      const mult = w === 1.5 ? 3 : w === 1 ? 2 : w === 0.5 ? 1 : 0;
      for (let i = 0; i < mult; i++) weightedDays.push(day);
    }
    const total = c.maxAmount;
    const unit = c.minUnit;
    let remaining = total;
    let i = 0;
    while (remaining > 0) {
      const amount = remaining >= unit ? unit : remaining;
      const date = weightedDays[i % weightedDays.length];
      tasks.push({ id: uid(), categoryId: c.id, amount, date, completed: false });
      remaining -= amount;
      i++;
    }
  }

  localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
  return tasks;
}

export default autoAllocateTasks;
