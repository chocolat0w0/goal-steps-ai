export interface Project {
  id: string;
  name: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  projectId: string;
  name: string;
  valueRange: {
    min: number;
    max: number;
  };
  deadline?: string;
  minUnit: number;
}

export type WeeklyDistribution = 'high' | 'low' | 'none';

export interface WeeklySettings {
  projectId: string;
  monday: WeeklyDistribution;
  tuesday: WeeklyDistribution;
  wednesday: WeeklyDistribution;
  thursday: WeeklyDistribution;
  friday: WeeklyDistribution;
  saturday: WeeklyDistribution;
  sunday: WeeklyDistribution;
}

export interface TaskBlock {
  id: string;
  categoryId: string;
  projectId: string;
  date: string;
  amount: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanGenerationSettings {
  respectCategoryDeadlines: boolean;
  prioritizeWeeklyDistribution: boolean;
}