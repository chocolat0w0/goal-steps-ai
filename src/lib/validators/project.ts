export function validateProjectName(name: string): string | null {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return 'プロジェクト名を入力してください';
  }
  
  if (trimmedName.length < 2) {
    return 'プロジェクト名は2文字以上で入力してください';
  }
  
  if (trimmedName.length > 50) {
    return 'プロジェクト名は50文字以内で入力してください';
  }
  
  return null;
}

export function validateDeadline(deadline: string): string | null {
  if (!deadline) {
    return '期限を設定してください';
  }

  const deadlineDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (deadlineDate < today) {
    return '期限は今日以降の日付を設定してください';
  }

  return null;
}