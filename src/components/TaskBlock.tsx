import { type TaskBlock as TaskBlockType, type Category } from '~/types';

interface TaskBlockProps {
  taskBlock: TaskBlockType;
  category: Category;
  onToggleCompletion: (blockId: string, completed: boolean) => void;
  isDragging?: boolean;
  isDroppable?: boolean;
}

function TaskBlock({
  taskBlock,
  category,
  onToggleCompletion,
  isDragging = false,
  isDroppable = false,
}: TaskBlockProps) {
  const handleToggleCompletion = () => {
    onToggleCompletion(taskBlock.id, !taskBlock.completed);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      blockId: taskBlock.id,
      categoryId: taskBlock.categoryId,
      originalDate: taskBlock.date,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const getCategoryColor = (categoryId: string): string => {
    // カテゴリーIDに基づいて一意の色を生成
    const colors = [
      'bg-blue-100 border-blue-300 text-blue-800',
      'bg-green-100 border-green-300 text-green-800',
      'bg-purple-100 border-purple-300 text-purple-800',
      'bg-red-100 border-red-300 text-red-800',
      'bg-yellow-100 border-yellow-300 text-yellow-800',
      'bg-pink-100 border-pink-300 text-pink-800',
      'bg-indigo-100 border-indigo-300 text-indigo-800',
      'bg-orange-100 border-orange-300 text-orange-800',
    ];
    
    // カテゴリーIDのハッシュ値で色を選択
    let hash = 0;
    for (let i = 0; i < categoryId.length; i++) {
      hash = categoryId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  const baseClasses = `
    relative p-3 mb-2 rounded-lg border-2 cursor-pointer transition-all duration-200
    ${taskBlock.completed ? 'opacity-60' : 'hover:shadow-md'}
    ${getCategoryColor(category.id)}
    ${isDragging ? 'opacity-50 transform rotate-2' : ''}
    ${isDroppable ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
  `;

  return (
    <div
      className={baseClasses}
      draggable={!taskBlock.completed}
      onDragStart={handleDragStart}
      onClick={handleToggleCompletion}
      title={`${category.name} - ${taskBlock.amount}単位${taskBlock.completed ? ' (完了)' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={taskBlock.completed}
            onChange={handleToggleCompletion}
            className="w-4 h-4 rounded focus:ring-2 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex-1">
            <div className={`font-medium text-sm ${taskBlock.completed ? 'line-through' : ''}`}>
              {category.name}
            </div>
            <div className="text-xs opacity-75">
              {taskBlock.amount} 単位
            </div>
          </div>
        </div>
        
        {!taskBlock.completed && (
          <div className="text-xs opacity-60">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
        )}
      </div>

      {taskBlock.completed && (
        <div className="absolute top-1 right-1">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default TaskBlock;