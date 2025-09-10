import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjects } from '../useProjects';
import { ProjectService } from '~/lib/projectService';
import { setupMockLocalStorage } from '~/test/mocks/localStorage';
import { mockProject } from '~/test/fixtures/testData';
import { type Project } from '~/types';

// ProjectServiceのモック
vi.mock('~/lib/projectService', () => ({
  ProjectService: {
    getAllProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    validateProjectName: vi.fn(),
    validateDeadline: vi.fn(),
  },
}));

describe('useProjects', () => {
  beforeEach(() => {
    setupMockLocalStorage();
    vi.clearAllMocks();
  });

  describe('初期化', () => {
    it('フックの初期状態が正しいこと', async () => {
      vi.mocked(ProjectService.getAllProjects).mockReturnValue([]);

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
      vi.mocked(ProjectService.getAllProjects).mockReturnValue(mockProjects);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(ProjectService.getAllProjects).toHaveBeenCalledTimes(1);
      expect(result.current.projects).toEqual(mockProjects);
    });

    it('プロジェクト読み込みエラー時にローディングがfalseになること', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      vi.mocked(ProjectService.getAllProjects).mockImplementation(() => {
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
      vi.mocked(ProjectService.getAllProjects).mockReturnValue([]);
      vi.mocked(ProjectService.validateProjectName).mockReturnValue(null);
      vi.mocked(ProjectService.validateDeadline).mockReturnValue(null);
    });

    it('有効な入力でプロジェクトを作成できること', async () => {
      const newProject = { ...mockProject, id: 'new-project' };
      vi.mocked(ProjectService.createProject).mockReturnValue(newProject);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdProject: Project | null = null;
      await act(async () => {
        createdProject = await result.current.createProject(
          '新しいプロジェクト',
          '2030-12-31'
        );
      });

      expect(createdProject).toEqual(newProject);
      expect(result.current.projects).toContain(newProject);
      expect(ProjectService.createProject).toHaveBeenCalledWith(
        '新しいプロジェクト',
        '2030-12-31'
      );
    });

    it('バリデーションエラー時にnullを返すこと', async () => {
      vi.mocked(ProjectService.validateProjectName).mockReturnValue(
        'プロジェクト名が無効です'
      );

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdProject: Project | null = null;
      await act(async () => {
        createdProject = await result.current.createProject('', '2030-12-31');
      });

      expect(createdProject).toBeNull();
      expect(ProjectService.createProject).not.toHaveBeenCalled();
    });

    it('期限バリデーションエラー時にnullを返すこと', async () => {
      vi.mocked(ProjectService.validateDeadline).mockReturnValue(
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
          '2020-01-01'
        );
      });

      expect(createdProject).toBeNull();
      expect(ProjectService.createProject).not.toHaveBeenCalled();
    });
  });

  describe('updateProject', () => {
    beforeEach(() => {
      vi.mocked(ProjectService.getAllProjects).mockReturnValue([mockProject]);
      vi.mocked(ProjectService.validateProjectName).mockReturnValue(null);
      vi.mocked(ProjectService.validateDeadline).mockReturnValue(null);
    });

    it('プロジェクトを更新できること', async () => {
      const updatedProject = { ...mockProject, name: '更新されたプロジェクト' };
      vi.mocked(ProjectService.updateProject).mockReturnValue(updatedProject);

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
      expect(ProjectService.updateProject).toHaveBeenCalledWith(
        mockProject.id,
        { name: '更新されたプロジェクト' }
      );
    });

    it('更新失敗時にnullを返すこと', async () => {
      vi.mocked(ProjectService.updateProject).mockReturnValue(null);

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
      vi.mocked(ProjectService.validateProjectName).mockReturnValue(
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
      expect(ProjectService.updateProject).not.toHaveBeenCalled();
    });
  });

  describe('deleteProject', () => {
    beforeEach(() => {
      vi.mocked(ProjectService.getAllProjects).mockReturnValue([mockProject]);
    });

    it('プロジェクトを削除できること', async () => {
      vi.mocked(ProjectService.deleteProject).mockReturnValue(true);

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
      expect(ProjectService.deleteProject).toHaveBeenCalledWith(mockProject.id);
    });

    it('削除失敗時にfalseを返すこと', async () => {
      vi.mocked(ProjectService.deleteProject).mockReturnValue(false);

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

      vi.mocked(ProjectService.getAllProjects)
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
      expect(ProjectService.getAllProjects).toHaveBeenCalledTimes(2);
    });
  });
});
