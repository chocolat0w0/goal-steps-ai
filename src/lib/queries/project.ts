import { type Project } from '~/types';
import { type StorageAdapter } from './types';
import { generateId, getCurrentTimestamp } from '~/lib/utils/common';

export function createProject(
  storage: StorageAdapter,
  name: string,
  startDate: string | undefined,
  deadline: string
): Project {
  const now = getCurrentTimestamp();
  const project: Project = {
    id: generateId(),
    name: name.trim(),
    startDate,
    deadline,
    createdAt: now,
    updatedAt: now,
  };

  const projects = storage.getProjects();
  projects.push(project);
  storage.saveProjects(projects);

  return project;
}

export function updateProject(
  storage: StorageAdapter,
  id: string,
  updates: Partial<Pick<Project, 'name' | 'startDate' | 'deadline'>>
): Project | null {
  const projects = storage.getProjects();
  const index = projects.findIndex((p) => p.id === id);

  if (index === -1) {
    return null;
  }

  const updatedProject: Project = {
    ...projects[index],
    ...updates,
    updatedAt: getCurrentTimestamp(),
  };

  projects[index] = updatedProject;
  storage.saveProjects(projects);

  return updatedProject;
}

export function deleteProject(storage: StorageAdapter, id: string): boolean {
  const projects = storage.getProjects();
  const index = projects.findIndex((p) => p.id === id);

  if (index === -1) {
    return false;
  }

  projects.splice(index, 1);
  storage.saveProjects(projects);

  const categories = storage.getCategories().filter((c) => c.projectId !== id);
  storage.saveCategories(categories);

  const weeklySettings = storage
    .getWeeklySettings()
    .filter((s) => s.projectId !== id);
  storage.saveWeeklySettings(weeklySettings);

  const taskBlocks = storage.getTaskBlocks().filter((t) => t.projectId !== id);
  storage.saveTaskBlocks(taskBlocks);

  return true;
}

export function getProject(
  storage: StorageAdapter,
  id: string
): Project | null {
  const projects = storage.getProjects();
  return projects.find((p) => p.id === id) || null;
}

export function getAllProjects(storage: StorageAdapter): Project[] {
  return storage
    .getProjects()
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}
