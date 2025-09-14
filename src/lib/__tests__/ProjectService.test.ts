import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createProject, 
  updateProject, 
  deleteProject, 
  getProjectById, 
  getAllProjects, 
  validateProjectName, 
  validateDeadline,
  generateId,
  getCurrentTimestamp
} from '../project';
import { setupMockLocalStorage, getStorageKey } from '~/test/mocks/localStorage';
import { mockProject } from '~/test/fixtures/testData';
import { type Project } from '~/types';

describe('ProjectService', () => {
  let mockStorage: ReturnType<typeof setupMockLocalStorage>;

  beforeEach(() => {
    mockStorage = setupMockLocalStorage();
  });

  describe('createProject', () => {
    it('新しいプロジェクトを作成できること', () => {
      const projectData = {
        name: 'テストプロジェクト',
        deadline: '2024-12-31'
      };

      const result = createProject(projectData.name, undefined, projectData.deadline);

      expect(result).toBeTruthy();
      expect(result.name).toBe(projectData.name);
      expect(result.deadline).toBe(projectData.deadline);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('作成したプロジェクトがlocalStorageに保存されること', () => {
      const projectData = {
        name: 'テストプロジェクト',
        deadline: '2024-12-31'
      };

      const result = createProject(projectData.name, undefined, projectData.deadline);
      
      expect(result).toBeTruthy();
      
      const storedProjects = JSON.parse(mockStorage.getItem(getStorageKey('projects')) || '[]');
      expect(storedProjects).toHaveLength(1);
      expect(storedProjects[0].id).toBe(result.id);
    });
  });

  describe('getAllProjects', () => {
    it('空の配列を返すこと（初期状態）', () => {
      const projects = getAllProjects();
      expect(projects).toEqual([]);
    });

    it('保存されたプロジェクトを取得できること', () => {
      const storedProjects = [mockProject];
      mockStorage.setItem(getStorageKey('projects'), JSON.stringify(storedProjects));

      const projects = getAllProjects();
      
      expect(projects).toHaveLength(1);
      expect(projects[0]).toEqual(mockProject);
    });

    it('複数のプロジェクトを取得できること', () => {
      const project2: Project = {
        ...mockProject,
        id: 'test-project-2',
        name: 'テストプロジェクト2'
      };
      const storedProjects = [mockProject, project2];
      mockStorage.setItem(getStorageKey('projects'), JSON.stringify(storedProjects));

      const projects = getAllProjects();
      
      expect(projects).toHaveLength(2);
    });

    it('更新日時の降順でソートされること', () => {
      const oldProject: Project = {
        ...mockProject,
        id: 'old-project',
        updatedAt: '2024-01-01T00:00:00Z'
      };
      const newProject: Project = {
        ...mockProject,
        id: 'new-project',
        updatedAt: '2024-02-01T00:00:00Z'
      };
      const storedProjects = [oldProject, newProject];
      mockStorage.setItem(getStorageKey('projects'), JSON.stringify(storedProjects));

      const projects = getAllProjects();
      
      expect(projects[0].id).toBe('new-project');
      expect(projects[1].id).toBe('old-project');
    });
  });

  describe('getProjectById', () => {
    beforeEach(() => {
      const storedProjects = [mockProject];
      mockStorage.setItem(getStorageKey('projects'), JSON.stringify(storedProjects));
    });

    it('IDで指定したプロジェクトを取得できること', () => {
      const project = getProjectById(mockProject.id);
      
      expect(project).toEqual(mockProject);
    });

    it('存在しないIDの場合はnullを返すこと', () => {
      const project = getProjectById('non-existent-id');
      
      expect(project).toBeNull();
    });
  });

  describe('updateProject', () => {
    beforeEach(() => {
      const storedProjects = [mockProject];
      mockStorage.setItem(getStorageKey('projects'), JSON.stringify(storedProjects));
    });

    it('プロジェクトを更新できること', () => {
      const updates = {
        name: '更新されたプロジェクト名',
        deadline: '2025-01-15'
      };

      const result = updateProject(mockProject.id, updates);

      expect(result).toBeTruthy();
      expect(result?.name).toBe(updates.name);
      expect(result?.deadline).toBe(updates.deadline);
      expect(result?.updatedAt).not.toBe(mockProject.updatedAt);
    });

    it('更新後のプロジェクトがlocalStorageに保存されること', () => {
      const updates = { name: '更新されたプロジェクト名' };

      updateProject(mockProject.id, updates);

      const storedProjects = JSON.parse(mockStorage.getItem(getStorageKey('projects')) || '[]');
      expect(storedProjects[0].name).toBe(updates.name);
    });

    it('存在しないIDの場合はnullを返すこと', () => {
      const result = updateProject('non-existent-id', { name: 'test' });
      
      expect(result).toBeNull();
    });
  });

  describe('deleteProject', () => {
    beforeEach(() => {
      const storedProjects = [mockProject];
      mockStorage.setItem(getStorageKey('projects'), JSON.stringify(storedProjects));
    });

    it('プロジェクトを削除できること', () => {
      const result = deleteProject(mockProject.id);
      
      expect(result).toBe(true);
    });

    it('削除後にプロジェクトがlocalStorageから削除されること', () => {
      deleteProject(mockProject.id);

      const storedProjects = JSON.parse(mockStorage.getItem(getStorageKey('projects')) || '[]');
      expect(storedProjects).toHaveLength(0);
    });

    it('存在しないIDの場合はfalseを返すこと', () => {
      const result = deleteProject('non-existent-id');
      
      expect(result).toBe(false);
    });

    it('関連データも削除されること', () => {
      // カテゴリ、設定、タスクブロックを追加
      mockStorage.setItem(getStorageKey('categories'), JSON.stringify([
        { id: 'cat1', projectId: mockProject.id },
        { id: 'cat2', projectId: 'other-project' }
      ]));
      mockStorage.setItem(getStorageKey('weekly-settings'), JSON.stringify([
        { id: 'ws1', projectId: mockProject.id },
        { id: 'ws2', projectId: 'other-project' }
      ]));
      mockStorage.setItem(getStorageKey('task-blocks'), JSON.stringify([
        { id: 'tb1', projectId: mockProject.id },
        { id: 'tb2', projectId: 'other-project' }
      ]));

      deleteProject(mockProject.id);

      // 他のプロジェクトのデータは残る
      const categories = JSON.parse(mockStorage.getItem(getStorageKey('categories')) || '[]');
      const settings = JSON.parse(mockStorage.getItem(getStorageKey('weekly-settings')) || '[]');
      const blocks = JSON.parse(mockStorage.getItem(getStorageKey('task-blocks')) || '[]');

      expect(categories).toHaveLength(1);
      expect(categories[0].projectId).toBe('other-project');
      expect(settings).toHaveLength(1);
      expect(settings[0].projectId).toBe('other-project');
      expect(blocks).toHaveLength(1);
      expect(blocks[0].projectId).toBe('other-project');
    });
  });

  describe('バリデーション機能', () => {
    it('プロジェクト名のバリデーションが正しく動作すること', () => {
      expect(validateProjectName('')).toBeTruthy();
      expect(validateProjectName('A')).toBeTruthy();
      expect(validateProjectName('OK')).toBeNull();
    });

    it('期限のバリデーションが正しく動作すること', () => {
      expect(validateDeadline('')).toBeTruthy();
      expect(validateDeadline('2020-01-01')).toBeTruthy();
      expect(validateDeadline('2030-12-31')).toBeNull();
    });
  });

  describe('ユーティリティ機能', () => {
    it('ID生成が正しく動作すること', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
    });

    it('タイムスタンプ生成が正しく動作すること', () => {
      const timestamp = getCurrentTimestamp();
      
      expect(typeof timestamp).toBe('string');
      expect(new Date(timestamp).getTime()).toBeGreaterThan(0);
    });
  });
});