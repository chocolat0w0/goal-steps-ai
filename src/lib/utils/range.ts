import { type TaskBlock, type Category } from '~/types';

export interface Range {
  start: number;
  end: number;
}

/**
 * 完了済みタスクブロックから実際の範囲を取得する
 */
export function getCompletedRanges(
  completedTaskBlocks: TaskBlock[],
  categoryId: string
): Range[] {
  return completedTaskBlocks
    .filter((block) => block.categoryId === categoryId && block.completed)
    .map((block) => ({
      start: block.start,
      end: block.end,
    }))
    .sort((a, b) => a.start - b.start);
}

/**
 * 範囲が重複しているかチェックする
 */
export function isOverlapping(range1: Range, range2: Range): boolean {
  return range1.start < range2.end && range2.start < range1.end;
}

/**
 * 重複する範囲をマージする
 */
export function mergeRanges(ranges: Range[]): Range[] {
  if (ranges.length === 0) return [];

  const sortedRanges = [...ranges].sort((a, b) => a.start - b.start);
  const merged: Range[] = [sortedRanges[0]];

  for (let i = 1; i < sortedRanges.length; i++) {
    const current = sortedRanges[i];
    const lastMerged = merged[merged.length - 1];

    if (isOverlapping(lastMerged, current) || lastMerged.end === current.start) {
      // 重複または隣接している場合はマージ
      lastMerged.end = Math.max(lastMerged.end, current.end);
    } else {
      // 重複していない場合は新しい範囲として追加
      merged.push(current);
    }
  }

  return merged;
}

/**
 * カテゴリーの範囲内で利用可能な範囲を取得する
 */
export function getAvailableRanges(
  category: Category,
  completedRanges: Range[]
): Range[] {
  const mergedCompletedRanges = mergeRanges(completedRanges);
  const availableRanges: Range[] = [];

  let currentStart = category.valueRange.min;
  const maxEnd = category.valueRange.max;

  for (const completedRange of mergedCompletedRanges) {
    // 完了済み範囲の前に利用可能な範囲があるかチェック
    if (currentStart < completedRange.start) {
      availableRanges.push({
        start: currentStart,
        end: completedRange.start,
      });
    }
    // 次の開始点を完了済み範囲の終了点に設定
    currentStart = Math.max(currentStart, completedRange.end);
  }

  // 最後の完了済み範囲の後に利用可能な範囲があるかチェック
  if (currentStart < maxEnd) {
    availableRanges.push({
      start: currentStart,
      end: maxEnd,
    });
  }

  return availableRanges;
}

/**
 * 利用可能範囲から指定された単位でブロック範囲を生成する
 */
export function generateBlockRanges(
  availableRanges: Range[],
  minUnit: number,
  requiredBlocks: number
): Range[] {
  const blockRanges: Range[] = [];
  let remainingBlocks = requiredBlocks;

  for (const availableRange of availableRanges) {
    if (remainingBlocks <= 0) break;

    const rangeSize = availableRange.end - availableRange.start;
    const possibleBlocks = Math.floor(rangeSize / minUnit);
    const blocksToTake = Math.min(possibleBlocks, remainingBlocks);

    for (let i = 0; i < blocksToTake; i++) {
      const start = availableRange.start + i * minUnit;
      const end = start + minUnit;
      blockRanges.push({ start, end });
    }

    remainingBlocks -= blocksToTake;
  }

  return blockRanges;
}

/**
 * 範囲が有効かチェックする（start < end かつ非負）
 */
export function isValidRange(range: Range): boolean {
  return range.start >= 0 && range.start < range.end;
}

/**
 * 範囲リストに重複がないかチェックする
 */
export function hasNoOverlaps(ranges: Range[]): boolean {
  const sortedRanges = [...ranges].sort((a, b) => a.start - b.start);

  for (let i = 1; i < sortedRanges.length; i++) {
    if (isOverlapping(sortedRanges[i - 1], sortedRanges[i])) {
      return false;
    }
  }

  return true;
}