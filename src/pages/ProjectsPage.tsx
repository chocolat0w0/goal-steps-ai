import { useState } from 'react';
import { type Project } from '~/types';
import { useProjects } from '~/hooks/useProjects';
import ProjectList from '~/components/ProjectList';
import ProjectForm from '~/components/ProjectForm';
import Modal from '~/components/Modal';

interface ProjectsPageProps {
  onSelectProject: (project: Project) => void;
}

function ProjectsPage({ onSelectProject }: ProjectsPageProps) {
  const { projects, loading, createProject, updateProject, deleteProject } =
    useProjects();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleCreateProject = async (
    name: string,
    startDate: string | undefined,
    deadline: string
  ) => {
    const result = await createProject(name, startDate, deadline);
    if (result) {
      setIsCreateModalOpen(false);
    }
    return result;
  };

  const handleEditProject = async (
    name: string,
    startDate: string | undefined,
    deadline: string
  ) => {
    if (!editingProject) return null;

    const result = await updateProject(editingProject.id, {
      name,
      startDate,
      deadline,
    });
    if (result) {
      setEditingProject(null);
    }
    return result;
  };

  const handleSelectProject = (project: Project) => {
    onSelectProject(project);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">プロジェクト</h1>
          <p className="text-gray-600 mt-2">
            目標達成に向けたプロジェクトを管理しましょう
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          新規プロジェクト
        </button>
      </div>

      <ProjectList
        projects={projects}
        onEditProject={setEditingProject}
        onDeleteProject={deleteProject}
        onSelectProject={handleSelectProject}
      />

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="新規プロジェクト作成"
      >
        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        title="プロジェクト編集"
      >
        {editingProject && (
          <ProjectForm
            project={editingProject}
            onSubmit={handleEditProject}
            onCancel={() => setEditingProject(null)}
            submitButtonText="更新"
          />
        )}
      </Modal>
    </div>
  );
}

export default ProjectsPage;
