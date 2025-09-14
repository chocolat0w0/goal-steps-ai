export function validateCategoryName(name: string): string | null {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return 'カテゴリー名を入力してください';
  }

  if (trimmedName.length < 2) {
    return 'カテゴリー名は2文字以上で入力してください';
  }

  if (trimmedName.length > 30) {
    return 'カテゴリー名は30文字以内で入力してください';
  }

  return null;
}

export function validateValueRange(min: number, max: number): string | null {
  if (min <= 0 || max <= 0) {
    return '値は1以上で入力してください';
  }

  if (min > max) {
    return '最大値は最小値以上で入力してください';
  }

  if (max - min > 10000) {
    return '範囲が大きすぎます（最大10000まで）';
  }

  return null;
}

export function validateMinUnit(minUnit: number, max: number): string | null {
  if (minUnit <= 0) {
    return '最小単位は1以上で入力してください';
  }

  if (minUnit > max) {
    return '最小単位は最大値以下で入力してください';
  }

  return null;
}

export function validateDeadline(
  deadline: string | undefined,
  projectDeadline: string
): string | null {
  if (!deadline) {
    return null; // 期限は任意
  }

  const deadlineDate = new Date(deadline);
  const projectDeadlineDate = new Date(projectDeadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (deadlineDate < today) {
    return '期限は今日以降の日付を設定してください';
  }

  if (deadlineDate > projectDeadlineDate) {
    return 'プロジェクトの期限以前の日付を設定してください';
  }

  return null;
}
