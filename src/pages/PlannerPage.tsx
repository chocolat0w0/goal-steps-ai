import { useEffect, useState, type FC } from 'react';
import ProjectSettingsForm from '~/components/ProjectSettingsForm';
import CategoryManager from '~/components/CategoryManager';
import AutoPlanButton from '~/components/AutoPlanButton';
import CalendarView from '~/components/CalendarView';
import autoAllocateTasks from '~/lib/autoAllocate';
import type { Category, TaskBlock } from '~/types';

const CAT_KEY = 'goal-steps:categories';
const TASK_KEY = 'goal-steps:tasks';

const PlannerPage: FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<TaskBlock[]>([]);

  useEffect(() => {
    const catRaw = localStorage.getItem(CAT_KEY);
    if (catRaw) {
      try {
        setCategories(JSON.parse(catRaw) as Category[]);
      } catch {
        // noop
      }
    }
    const taskRaw = localStorage.getItem(TASK_KEY);
    if (taskRaw) {
      try {
        setTasks(JSON.parse(taskRaw) as TaskBlock[]);
      } catch {
        // noop
      }
    }
  }, []);

  const handleAddCategory = (c: Category) => {
    const next = [...categories, c];
    setCategories(next);
    localStorage.setItem(CAT_KEY, JSON.stringify(next));
  };

  const handleUpdateCategory = (c: Category) => {
    const next = categories.map((x) => (x.id === c.id ? c : x));
    setCategories(next);
    localStorage.setItem(CAT_KEY, JSON.stringify(next));
  };

  const handleDeleteCategory = (id: string) => {
    const next = categories.filter((c) => c.id !== id);
    setCategories(next);
    localStorage.setItem(CAT_KEY, JSON.stringify(next));
    const nextTasks = tasks.filter((t) => t.categoryId !== id);
    setTasks(nextTasks);
    localStorage.setItem(TASK_KEY, JSON.stringify(nextTasks));
  };

  const handlePlan = () => {
    const generated = autoAllocateTasks();
    setTasks(generated);
    localStorage.setItem(TASK_KEY, JSON.stringify(generated));
    return generated.length;
  };

  const handleToggleTask = (id: string) => {
    const next = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    setTasks(next);
    localStorage.setItem(TASK_KEY, JSON.stringify(next));
  };

  const completed = tasks.filter((t) => t.completed).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <header className="mx-auto max-w-5xl">
        <h1 className="text-2xl md:text-3xl font-bold">goal-steps</h1>
        <p className="text-sm text-gray-600 mt-1">目標達成のためのタスク管理を補助するアプリ</p>
      </header>
      <main className="mx-auto mt-8 max-w-5xl">
        <ProjectSettingsForm />
        <CategoryManager
          categories={categories}
          onAdd={handleAddCategory}
          onUpdate={handleUpdateCategory}
          onDelete={handleDeleteCategory}
        />
        <AutoPlanButton onPlan={handlePlan} />
        {tasks.length > 0 && (
          <section className="rounded-lg bg-white p-6 shadow-sm mt-8" aria-label="進捗">
            <p>進捗率: {progress}%</p>
          </section>
        )}
        <CalendarView tasks={tasks} categories={categories} onToggleTask={handleToggleTask} />
      </main>
    </div>
  );
};

export default PlannerPage;

