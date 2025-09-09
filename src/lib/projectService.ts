import { type Project } from '~/types';
import { Storage } from './storage';

export class ProjectService {
  static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  static createProject(name: string, deadline: string): Project {
    const now = this.getCurrentTimestamp();
    const project: Project = {
      id: this.generateId(),
      name: name.trim(),
      deadline,
      createdAt: now,
      updatedAt: now,
    };

    const projects = Storage.getProjects();
    projects.push(project);
    Storage.saveProjects(projects);

    return project;
  }

  static updateProject(id: string, updates: Partial<Pick<Project, 'name' | 'deadline'>>): Project | null {
    const projects = Storage.getProjects();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) {
      return null;
    }

    const updatedProject: Project = {
      ...projects[index],
      ...updates,
      updatedAt: this.getCurrentTimestamp(),
    };

    projects[index] = updatedProject;
    Storage.saveProjects(projects);

    return updatedProject;
  }

  static deleteProject(id: string): boolean {
    const projects = Storage.getProjects();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) {
      return false;
    }

    projects.splice(index, 1);
    Storage.saveProjects(projects);

    // 関連するカテゴリ、設定、タスクブロックも削除
    const categories = Storage.getCategories().filter(c => c.projectId !== id);
    Storage.saveCategories(categories);

    const weeklySettings = Storage.getWeeklySettings().filter(s => s.projectId !== id);
    Storage.saveWeeklySettings(weeklySettings);

    const taskBlocks = Storage.getTaskBlocks().filter(t => t.projectId !== id);
    Storage.saveTaskBlocks(taskBlocks);

    return true;
  }

  static getProject(id: string): Project | null {
    const projects = Storage.getProjects();
    return projects.find(p => p.id === id) || null;
  }

  static getAllProjects(): Project[] {
    return Storage.getProjects().sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  static validateProjectName(name: string): string | null {
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

  static validateDeadline(deadline: string): string | null {
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
}