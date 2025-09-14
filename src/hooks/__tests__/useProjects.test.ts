import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjects } from '../useProjects';
import * as projectService from '~/lib/project';
import { setupMockLocalStorage } from '~/test/mocks/localStorage';
import { mockProject } from '~/test/fixtures/testData';
import { type Project } from '~/types';

// ProjectServiceのモック
vi.mock('~/lib/project', () => ({
  getAllProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  validateProjectName: vi.fn(),
  validateDeadline: vi.fn(),
}));

describe('useProjects', () => {
  beforeEach(() => {
    setupMockLocalStorage();
    vi.clearAllMocks();
  });

  describe('初期化', () => {
    it('フックの初期状態が正しいこと', async () => {
      vi.mocked(projectService.getAllProjects).mockReturnValue([]);

      const { result } = renderHook(() => useProjects());

      expect(result.current.projects).toEqual([]);
      expect(typeof result.current.createProject).toBe('function');
      expect(typeof result.current.updateProject).toBe('function');
      expect(typeof result.current.deleteProject).toBe('function');
      expect(typeof result.current.refreshProjects).toBe('function');

      // ローディングが完了するまで待機
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('初期化時にプロジェクトを読み込むこと', async () => {
      const mockProjects = [mockProject];
      vi.mocked(projectService.getAllProjects).mockReturnValue(mockProjects);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(projectService.getAllProjects).toHaveBeenCalledTimes(1);
      expect(result.current.projects).toEqual(mockProjects);
    });

    it('プロジェクト読み込みエラー時にローディングがfalseになること', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      vi.mocked(projectService.getAllProjects).mockImplementation(() => {
        throw new Error('Loading failed');
      });

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.projects).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load projects:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('createProject', () => {
    beforeEach(() => {
      vi.mocked(projectService.getAllProjects).mockReturnValue([]);
      vi.mocked(projectService.validateProjectName).mockReturnValue(null);
      vi.mocked(projectService.validateDeadline).mockReturnValue(null);
    });

    it('有効な入力でプロジェクトを作成できること', async () => {
      const newProject = { ...mockProject, id: 'new-project' };
      vi.mocked(projectService.createProject).mockReturnValue(newProject);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdProject: Project | null = null;
      await act(async () => {
        createdProject = await result.current.createProject(
          '新しいプロジェクト',
          undefined,
          '2030-12-31'
        );
      });

      expect(createdProject).toEqual(newProject);
      expect(result.current.projects).toContain(newProject);
      expect(projectService.createProject).toHaveBeenCalledWith(
        '新しいプロジェクト',
        undefined,
        '2030-12-31'
      );
    });

    it('バリデーションエラー時にnullを返すこと', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(projectService.validateProjectName).mockReturnValue(
        'プロジェクト名が無効です'
      );

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdProject: Project | null = null;
      await act(async () => {
        createdProject = await result.current.createProject('', undefined, '2030-12-31');
      });

      expect(createdProject).toBeNull();
      expect(projectService.createProject).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('期限バリデーションエラー時にnullを返すこと', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(projectService.validateDeadline).mockReturnValue(
        '期限が無効です'
      );

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdProject: Project | null = null;
      await act(async () => {
        createdProject = await result.current.createProject(
          'テストプロジェクト',
          undefined,
          '2020-01-01'
        );
      });

      expect(createdProject).toBeNull();
      expect(projectService.createProject).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('updateProject', () => {
    beforeEach(() => {
      vi.mocked(projectService.getAllProjects).mockReturnValue([mockProject]);
      vi.mocked(projectService.validateProjectName).mockReturnValue(null);
      vi.mocked(projectService.validateDeadline).mockReturnValue(null);
    });

    it('プロジェクトを更新できること', async () => {
      const updatedProject = { ...mockProject, name: '更新されたプロジェクト' };
      vi.mocked(projectService.updateProject).mockReturnValue(updatedProject);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: Project | null = null;
      await act(async () => {
        updateResult = await result.current.updateProject(mockProject.id, {
          name: '更新されたプロジェクト',
        });
      });

      expect(updateResult).toEqual(updatedProject);
      expect(result.current.projects).toContainEqual(updatedProject);
      expect(projectService.updateProject).toHaveBeenCalledWith(
        mockProject.id,
        { name: '更新されたプロジェクト' }
      );
    });

    it('更新失敗時にnullを返すこと', async () => {
      vi.mocked(projectService.updateProject).mockReturnValue(null);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: Project | null = null;
      await act(async () => {
        updateResult = await result.current.updateProject('non-existent', {
          name: 'test',
        });
      });

      expect(updateResult).toBeNull();
    });

    it('名前バリデーションエラー時にnullを返すこと', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(projectService.validateProjectName).mockReturnValue(
        'プロジェクト名が無効です'
      );

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: Project | null = null;
      await act(async () => {
        updateResult = await result.current.updateProject(mockProject.id, {
          name: '',
        });
      });

      expect(updateResult).toBeNull();
      expect(projectService.updateProject).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('deleteProject', () => {
    beforeEach(() => {
      vi.mocked(projectService.getAllProjects).mockReturnValue([mockProject]);
    });

    it('プロジェクトを削除できること', async () => {
      vi.mocked(projectService.deleteProject).mockReturnValue(true);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deleteResult: boolean = false;
      await act(async () => {
        deleteResult = await result.current.deleteProject(mockProject.id);
      });

      expect(deleteResult).toBe(true);
      expect(result.current.projects).not.toContainEqual(mockProject);
      expect(projectService.deleteProject).toHaveBeenCalledWith(mockProject.id);
    });

    it('削除失敗時にfalseを返すこと', async () => {
      vi.mocked(projectService.deleteProject).mockReturnValue(false);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deleteResult: boolean = false;
      await act(async () => {
        deleteResult = await result.current.deleteProject('non-existent');
      });

      expect(deleteResult).toBe(false);
      expect(result.current.projects).toContainEqual(mockProject);
    });
  });

  describe('refreshProjects', () => {
    it('プロジェクトリストを再読み込みできること', async () => {
      const initialProjects = [mockProject];
      const updatedProjects = [
        mockProject,
        { ...mockProject, id: 'project-2' },
      ];

      vi.mocked(projectService.getAllProjects)
        .mockReturnValueOnce(initialProjects)
        .mockReturnValueOnce(updatedProjects);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.projects).toEqual(initialProjects);

      await act(async () => {
        result.current.refreshProjects();
      });

      expect(result.current.projects).toEqual(updatedProjects);
      expect(projectService.getAllProjects).toHaveBeenCalledTimes(2);
    });
  });
});
