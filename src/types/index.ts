export type ID = string;

export interface Category {
  id: ID;
  name: string;
  minAmount: number; // 全体量の最小
  maxAmount: number; // 全体量の最大
  minUnit: number; // 最小単位（基本は1）
  deadline?: string; // YYYY-MM-DD（任意）
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
}

export interface TaskBlock {
  id: ID;
  categoryId: ID;
  amount: number;
  start: number;
  end: number;
  date: string; // YYYY-MM-DD
  completed: boolean;
}
