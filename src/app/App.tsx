import ProjectSettingsForm from '~/components/ProjectSettingsForm';
import type { FC } from 'react';

const App: FC = () => {
  return (
    <div className="min-h-screen p-6 md:p-10">
      <header className="mx-auto max-w-5xl">
        <h1 className="text-2xl md:text-3xl font-bold">goal-steps</h1>
        <p className="text-sm text-gray-600 mt-1">目標達成のためのタスク管理を補助するアプリ</p>
      </header>
      <main className="mx-auto mt-8 max-w-5xl">
        <ProjectSettingsForm />
      </main>
    </div>
  );
};

export default App;
