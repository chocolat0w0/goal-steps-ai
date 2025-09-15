import { type Category } from '~/types';

// total units represent the measurable range including the final unit
export function getTotalUnits(category: Category): number {
  return (
    category.valueRange.max - category.valueRange.min + category.minUnit
  );
}

export function calculateProgress(
  completedUnits: number,
  totalUnits: number
) {
  const percentage =
    totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;
  return { completed: completedUnits, total: totalUnits, percentage };
}
