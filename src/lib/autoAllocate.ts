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
  const project = JSON.parse(localStorage.getItem(PROJ_KEY) || '{}') as {
    deadline?: string;
  };
  if (!project.deadline) return [];
  const projectDeadline = project.deadline!;
  const weekWeights = loadWeekWeights();
  const tasks: TaskBlock[] = [];
  const start = new Date(formatDate(today));

  // 全カテゴリーの総量から各日の上限を算出
  const totalAmount = categories.reduce((s, c) => s + c.maxAmount, 0);
  const end = new Date(projectDeadline);
  const days: string[] = [];
  const dayWeights: Record<string, number> = {};
  const iter = new Date(start);
  while (iter <= end) {
    const w = weekWeights[iter.getDay()];
    if (w > 0) {
      const day = formatDate(iter);
      days.push(day);
      dayWeights[day] = w;
    }
    iter.setDate(iter.getDate() + 1);
  }
  if (days.length === 0) return [];
  const weightSum = days.reduce((s, d) => s + dayWeights[d], 0);
  const basePerWeight = totalAmount / weightSum;
  const capacities: Record<string, number> = {};
  for (const d of days) {
    capacities[d] = basePerWeight * dayWeights[d];
  }

  // 締切が早いものから処理
  const sorted = [...categories].sort((a, b) => {
    const da = a.deadline && a.deadline < projectDeadline ? a.deadline : projectDeadline;
    const db = b.deadline && b.deadline < projectDeadline ? b.deadline : projectDeadline;
    return da.localeCompare(db);
  });

  for (const c of sorted) {
    const deadline = c.deadline && c.deadline < projectDeadline ? c.deadline : projectDeadline;
    const validDays = days.filter((d) => d <= deadline);
    if (validDays.length === 0) continue;
    const weightedDays: string[] = [];
    for (const day of validDays) {
      const w = dayWeights[day];
      const mult = w === 1.5 ? 3 : w === 1 ? 2 : w === 0.5 ? 1 : 0;
      for (let i = 0; i < mult; i++) weightedDays.push(day);
    }
    if (weightedDays.length === 0) continue;
    const unit = c.minUnit;
    let remaining = c.maxAmount;
    let i = 0;
    let attempts = 0;
    while (remaining > 0) {
      const date = weightedDays[i % weightedDays.length];
      const amount = remaining >= unit ? unit : remaining;
      if (capacities[date] >= amount || capacities[date] > 0) {
        tasks.push({ id: uid(), categoryId: c.id, amount, date, completed: false });
        capacities[date] -= amount;
        if (capacities[date] < 0) capacities[date] = 0;
        remaining -= amount;
        attempts = 0;
      } else {
        attempts++;
        if (attempts >= weightedDays.length) break;
      }
      i++;
    }
  }

  localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
  return tasks;
}

export default autoAllocateTasks;
