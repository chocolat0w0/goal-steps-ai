import { useState, useEffect } from 'react';
import { type Project } from '~/types';
import {
  createProject as createProjectFn,
  updateProject as updateProjectFn,
  deleteProject as deleteProjectFn,
  getAllProjects,
  validateProjectName,
  validateDeadline,
} from '~/lib/project';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    try {
      const loadedProjects = getAllProjects();
      setProjects(loadedProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = (
    name: string,
    startDate: string | undefined,
    deadline: string
  ): Promise<Project | null> => {
    return new Promise((resolve) => {
      try {
        const nameError = validateProjectName(name);
        if (nameError) {
          throw new Error(nameError);
        }

        const deadlineError = validateDeadline(deadline);
        if (deadlineError) {
          throw new Error(deadlineError);
        }

        const newProject = createProjectFn(name, startDate, deadline);
        setProjects((prev) => [newProject, ...prev]);
        resolve(newProject);
      } catch (error) {
        console.error('Failed to create project:', error);
        resolve(null);
      }
    });
  };

  const updateProject = (
    id: string,
    updates: Partial<Pick<Project, 'name' | 'startDate' | 'deadline'>>
  ): Promise<Project | null> => {
    return new Promise((resolve) => {
      try {
        if (updates.name !== undefined) {
          const nameError = validateProjectName(updates.name);
          if (nameError) {
            throw new Error(nameError);
          }
        }

        if (updates.deadline !== undefined) {
          const deadlineError = validateDeadline(updates.deadline);
          if (deadlineError) {
            throw new Error(deadlineError);
          }
        }

        const updatedProject = updateProjectFn(id, updates);
        if (updatedProject) {
          setProjects((prev) =>
            prev.map((p) => (p.id === id ? updatedProject : p))
          );
        }
        resolve(updatedProject);
      } catch (error) {
        console.error('Failed to update project:', error);
        resolve(null);
      }
    });
  };

  const deleteProject = (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const success = deleteProjectFn(id);
        if (success) {
          setProjects((prev) => prev.filter((p) => p.id !== id));
        }
        resolve(success);
      } catch (error) {
        console.error('Failed to delete project:', error);
        resolve(false);
      }
    });
  };

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects: loadProjects,
  };
}
