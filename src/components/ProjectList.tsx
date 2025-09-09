import { useState } from 'react';
import { type Project } from '~/types';

interface ProjectListProps {
  projects: Project[];
  onEditProject: (project: Project) => void;
  onDeleteProject: (id: string) => Promise<boolean>;
  onSelectProject: (project: Project) => void;
}

function ProjectList({ projects, onEditProject, onDeleteProject, onSelectProject }: ProjectListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('このプロジェクトを削除しますか？関連するすべてのデータも削除されます。')) {
      return;
    }

    setDeletingId(id);
    try {
      const success = await onDeleteProject(id);
      if (!success) {
        alert('プロジェクトの削除に失敗しました');
      }
    } catch (error) {
      alert('プロジェクトの削除中にエラーが発生しました');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)}日経過`;
    if (diffDays === 0) return '今日まで';
    return `残り${diffDays}日`;
  };

  const getDeadlineColor = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600';
    if (diffDays <= 7) return 'text-orange-600';
    if (diffDays <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-4">プロジェクトがありません</div>
        <p className="text-gray-500">新しいプロジェクトを作成して目標管理を始めましょう</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <div key={project.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => onSelectProject(project)}>
                {project.name}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => onEditProject(project)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="編集"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  disabled={deletingId === project.id}
                  className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                  title="削除"
                >
                  {deletingId === project.id ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">期限: </span>
                <span className="font-medium">{formatDate(project.deadline)}</span>
              </div>
              <div>
                <span className={`font-medium ${getDeadlineColor(project.deadline)}`}>
                  {getDaysUntilDeadline(project.deadline)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">更新: </span>
                <span>{formatDate(project.updatedAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => onSelectProject(project)}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
            >
              プロジェクトを開く →
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProjectList;