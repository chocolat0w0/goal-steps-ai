import { useState, type FC } from 'react';

interface Props {
  onPlan: () => number;
}

const AutoPlanButton: FC<Props> = ({ onPlan }) => {
  const [message, setMessage] = useState('');

  const handleClick = () => {
    const count = onPlan();
    setMessage(count > 0 ? `タスクを${count}件作成しました` : 'タスクを作成できませんでした');
  };

  return (
    <section className="rounded-lg border bg-white p-6 shadow-sm mt-8" aria-label="自動計画">
      <h2 className="text-lg font-semibold mb-4">自動計画</h2>
      <button
        type="button"
        onClick={handleClick}
        className="rounded bg-green-600 px-3 py-1.5 text-white hover:bg-green-700"
      >
        自動計画を作成
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </section>
  );
};

export default AutoPlanButton;
