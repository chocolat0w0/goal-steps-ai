import { useState, useEffect, type FormEvent, type FC } from 'react';

const STORAGE_KEY = 'goal-steps:project-settings';

interface ProjectSettings {
  name: string;
  deadline: string;
}

const ProjectSettingsForm: FC = () => {
  const [name, setName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [saved, setSaved] = useState<ProjectSettings | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ProjectSettings;
        setName(parsed.name);
        setDeadline(parsed.deadline);
        setSaved(parsed);
      } catch {
        // noop
      }
    }
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data: ProjectSettings = { name, deadline };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSaved(data);
  };

  return (
    <section className="rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">プロジェクトの設定</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="project-name" className="block text-sm font-medium">
            プロジェクト名
          </label>
          <input
            id="project-name"
            type="text"
            className="mt-1 w-full rounded border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="project-deadline" className="block text-sm font-medium">
            期限
          </label>
          <input
            id="project-deadline"
            type="date"
            className="mt-1 w-full rounded border px-3 py-2"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
        >
          保存
        </button>
      </form>
      {saved && (
        <div className="mt-4 text-gray-700">
          <p>
            <span className="font-semibold">プロジェクト名:</span> {saved.name}
          </p>
          <p>
            <span className="font-semibold">期限:</span> {saved.deadline}
          </p>
        </div>
      )}
    </section>
  );
};

export default ProjectSettingsForm;
