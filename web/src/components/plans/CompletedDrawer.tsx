import type { Todo } from "../../types/entities";

interface CompletedDrawerProps {
  isOpen: boolean;
  completedTodos: Todo[];
  onClose: () => void;
  onRestore: (id: string) => void;
}

export function CompletedDrawer({ isOpen, completedTodos, onClose, onRestore }: CompletedDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* 抽屉 */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 
        flex flex-col animate-slide-in-right">
        {/* 头部 */}
        <div className="p-4 border-b flex items-center justify-between bg-gray-100">
          <h2 className="text-xl font-bold">🗑️ 已完成 ({completedTodos.length})</h2>
          <button 
            onClick={onClose}
            className="text-2xl text-gray-600 hover:text-gray-900"
          >
            ×
          </button>
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {completedTodos.length === 0 ? (
            <div className="text-center text-gray-400 mt-8">
              <div className="text-4xl mb-2">✨</div>
              <div>暂无已完成的待办</div>
            </div>
          ) : (
            completedTodos.map((todo) => (
              <div
                key={todo.id}
                className="p-3 bg-gray-100 rounded-lg shadow-sm opacity-70
                  transform rotate-1 hover:rotate-0 transition-transform"
                style={{
                  background: todo.priority === "high" ? "#fecaca" : 
                             todo.priority === "medium" ? "#fef08a" : "#bfdbfe"
                }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="line-through text-sm">{todo.text}</div>
                    {todo.completed_at && (
                      <div className="text-xs text-gray-600 mt-1">
                        ✓ {todo.completed_at.slice(0, 16).replace('T', ' ')}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onRestore(todo.id)}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded
                      hover:bg-blue-600"
                    title="恢复到墙上"
                  >
                    恢复
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
