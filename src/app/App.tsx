import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="min-h-screen p-6 md:p-10">
      <header className="mx-auto max-w-5xl">
        <h1 className="text-2xl md:text-3xl font-bold">goal-steps</h1>
        <p className="text-sm text-gray-600 mt-1">目標達成のためのタスク管理を補助するアプリ</p>
      </header>
      <main className="mx-auto mt-8 max-w-5xl">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">初期セットアップ完了</h2>
          <p className="mt-2 text-gray-700">
            Vite + React + TypeScript + Tailwind の構成が動作します。
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
              onClick={() => setCount((c) => c + 1)}
            >
              カウント: {count}
            </button>
            <span className="text-gray-600">ボタンで挙動確認できます。</span>
          </div>
        </div>
      </main>
    </div>
  );
}

