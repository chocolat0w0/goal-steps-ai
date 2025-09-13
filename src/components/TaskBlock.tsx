import { type TaskBlock as TaskBlockType, type Category } from '~/types';

interface TaskBlockProps {
  block?: TaskBlockType;
  taskBlock?: TaskBlockType;
  category?: Category;
  allTaskBlocks: TaskBlockType[];
  onToggleCompletion: (blockId: string, completed: boolean) => void;
  isDragging?: boolean;
  isDroppable?: boolean;
  isCompact?: boolean;
}

function TaskBlock({
  block,
  taskBlock,
  category,
  allTaskBlocks,
  onToggleCompletion,
  isDragging = false,
  isDroppable = false,
  isCompact = false,
}: TaskBlockProps) {
  // block または taskBlock のどちらかを使用（後方互換性のため）
  const currentBlock = block || taskBlock;
  
  if (!currentBlock || !category) {
    return null;
  }
  const handleToggleCompletion = () => {
    onToggleCompletion(currentBlock.id, !currentBlock.completed);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', currentBlock.id);
    e.dataTransfer.setData('application/json', JSON.stringify({
      blockId: currentBlock.id,
      categoryId: currentBlock.categoryId,
      originalDate: currentBlock.date,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const getProgressRange = (): { start: number; end: number } => {
    // 同じカテゴリーのタスクブロックを日付順にソート
    const categoryBlocks = allTaskBlocks
      .filter(block => block.categoryId === currentBlock.categoryId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // 現在のブロックのインデックスを取得
    const currentIndex = categoryBlocks.findIndex(block => block.id === currentBlock.id);
    
    // 最小単位刻みで開始・終了を計算
    const start = category.valueRange.min + (currentIndex * category.minUnit);
    const end = start + category.minUnit;
    
    return {
      start,
      end
    };
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

  const progressRange = getProgressRange();
  
  const baseClasses = isCompact 
    ? `
      relative px-2 py-1 rounded-md border cursor-pointer transition-all duration-200 text-xs
      ${currentBlock.completed ? 'opacity-60' : 'hover:shadow-sm'}
      ${getCategoryColor(category.id)}
      ${isDragging ? 'opacity-50 transform rotate-1' : ''}
      ${isDroppable ? 'ring-1 ring-blue-400 ring-opacity-50' : ''}
    `
    : `
      relative p-3 mb-2 rounded-lg border-2 cursor-pointer transition-all duration-200
      ${currentBlock.completed ? 'opacity-60' : 'hover:shadow-md'}
      ${getCategoryColor(category.id)}
      ${isDragging ? 'opacity-50 transform rotate-2' : ''}
      ${isDroppable ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
    `;

  if (isCompact) {
    return (
      <div
        className={baseClasses}
        draggable={!currentBlock.completed}
        onDragStart={handleDragStart}
        onClick={handleToggleCompletion}
        title={`${category.name} - ${progressRange.start} - ${progressRange.end}${currentBlock.completed ? ' (完了)' : ''}`}
      >
        <div className="flex items-center space-x-1">
          <input
            type="checkbox"
            checked={currentBlock.completed}
            onChange={handleToggleCompletion}
            className="w-3 h-3 rounded focus:ring-1 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
          <div className={`font-medium ${currentBlock.completed ? 'line-through' : ''}`}>
            {category.name}
          </div>
          <div className="opacity-75">
            {progressRange.start}-{progressRange.end}
          </div>
        </div>
        
        {currentBlock.completed && (
          <div className="absolute top-0 right-0">
            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={baseClasses}
      draggable={!currentBlock.completed}
      onDragStart={handleDragStart}
      onClick={handleToggleCompletion}
      title={`${category.name} - ${progressRange.start} - ${progressRange.end}${currentBlock.completed ? ' (完了)' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={currentBlock.completed}
            onChange={handleToggleCompletion}
            className="w-4 h-4 rounded focus:ring-2 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex-1">
            <div className={`font-medium text-sm ${currentBlock.completed ? 'line-through' : ''}`}>
              {category.name}
            </div>
            <div className="text-xs opacity-75">
              {progressRange.start} - {progressRange.end}
            </div>
          </div>
        </div>
        
        {!currentBlock.completed && (
          <div className="text-xs opacity-60">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
        )}
      </div>

      {currentBlock.completed && (
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