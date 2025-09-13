import { type Project } from '~/types';
import { 
  validateProjectName, 
  validateDeadline 
} from './validators/project';
import {
  createProject as createProjectQuery,
  updateProject as updateProjectQuery,
  deleteProject as deleteProjectQuery,
  getProject,
  getAllProjects as getAllProjectsQuery
} from './queries/project';
import { generateId, getCurrentTimestamp } from './utils/common';
import { createStorageAdapter } from './queries/storage';

const storage = createStorageAdapter();

export function createProject(name: string, startDate: string | undefined, deadline: string): Project {
  return createProjectQuery(storage, name, startDate, deadline);
}

export function updateProject(id: string, updates: Partial<Pick<Project, 'name' | 'startDate' | 'deadline'>>): Project | null {
  return updateProjectQuery(storage, id, updates);
}

export function deleteProject(id: string): boolean {
  return deleteProjectQuery(storage, id);
}

export function getProjectById(id: string): Project | null {
  return getProject(storage, id);
}

export function getAllProjects(): Project[] {
  return getAllProjectsQuery(storage);
}

export {
  generateId,
  getCurrentTimestamp,
  validateProjectName,
  validateDeadline
};