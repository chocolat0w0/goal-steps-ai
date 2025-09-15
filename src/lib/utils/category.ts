import { type Category } from '~/types';

// total units should represent the actual measurable range, not the number of blocks
export function getTotalUnits(category: Category): number {
  return category.valueRange.max - category.valueRange.min;
}

export function calculateProgress(
  completedUnits: number,
  totalUnits: number
) {
  const percentage =
    totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;
  return { completed: completedUnits, total: totalUnits, percentage };
}
