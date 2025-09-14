import { type Category } from '~/types';

export function getTotalUnits(category: Category): number {
  return Math.ceil(
    (category.valueRange.max - category.valueRange.min + 1) / category.minUnit
  );
}

export function calculateProgress(
  completedBlocksCount: number,
  totalUnits: number
) {
  const percentage =
    totalUnits > 0 ? Math.round((completedBlocksCount / totalUnits) * 100) : 0;
  return { completed: completedBlocksCount, total: totalUnits, percentage };
}
