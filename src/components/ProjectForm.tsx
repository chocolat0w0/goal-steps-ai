import { useState } from 'react';
import { type Project } from '~/types';

interface ProjectFormProps {
  project?: Project;
  onSubmit: (name: string, deadline: string) => Promise<Project | null>;
  onCancel: () => void;
  submitButtonText?: string;
}

function ProjectForm({ project, onSubmit, onCancel, submitButtonText = '作成' }: ProjectFormProps) {
  const [name, setName] = useState(project?.name || '');
  const [deadline, setDeadline] = useState(project?.deadline || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await onSubmit(name, deadline);
      if (result) {
        // 成功時は親コンポーネントでフォームを閉じる
      } else {
        setError('プロジェクトの保存に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-2">
          プロジェクト名
        </label>
        <input
          id="project-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：○○試験合格"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isSubmitting}
          required
        />
      </div>

      <div>
        <label htmlFor="project-deadline" className="block text-sm font-medium text-gray-700 mb-2">
          目標期限
        </label>
        <input
          id="project-deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isSubmitting}
          required
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '保存中...' : submitButtonText}
        </button>
      </div>
    </form>
  );
}

export default ProjectForm;