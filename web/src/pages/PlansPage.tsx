import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { todoAPI } from "../api/admin";
import { StickyWall } from "../components/plans/StickyWall";
import { TrashBin } from "../components/plans/TrashBin";
import { CompletedDrawer } from "../components/plans/CompletedDrawer";
import type { Todo } from "../types/entities";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

export default function PlansPage() {
  const [newTodoText, setNewTodoText] = useState("");
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Todo | null>(null);
  const queryClient = useQueryClient();

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["plans", "todos"],
    queryFn: todoAPI.list,
  });

  const createMutation = useMutation({
    mutationFn: todoAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", "todos"] });
      setNewTodoText("");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: todoAPI.toggle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", "todos"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => todoAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", "todos"] });
      setEditingTodo(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: todoAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", "todos"] });
    },
  });

  const handleCreate = (priority: "high" | "medium" | "low") => {
    if (!newTodoText.trim()) return;
    createMutation.mutate({
      text: newTodoText,
      priority,
      done: false,
      due_date: "",
      sort_order: 0,
    });
  };

  const handleToggle = (id: string) => {
    toggleMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    const target = todos.find((t) => t.id === id);
    if (target) setDeleteTarget(target);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
  };

  const handleUpdate = () => {
    if (!editingTodo) return;
    updateMutation.mutate({
      id: editingTodo.id,
      text: editingTodo.text,
      priority: editingTodo.priority,
      done: editingTodo.done,
      due_date: editingTodo.due_date,
      sort_order: editingTodo.sort_order,
    });
  };

  const handleRestore = (id: string) => {
    toggleMutation.mutate(id);
  };

  // 只显示非习惯的待办
  const regularTodos = todos.filter((t) => !t.is_habit);
  const completedTodos = regularTodos.filter((t) => t.done);

  if (isLoading) {
    return <div className="p-8">加载中...</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b p-4 flex items-center gap-4">
        <h1 className="text-2xl font-bold">📋 待办便利贴</h1>
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCreate("medium")}
            placeholder="输入新待办，回车创建..."
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={() => handleCreate("high")}
            className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            高优先级
          </button>
          <button
            onClick={() => handleCreate("medium")}
            className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            中优先级
          </button>
          <button
            onClick={() => handleCreate("low")}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            低优先级
          </button>
        </div>
      </div>

      {/* 便利贴墙 */}
      <StickyWall todos={regularTodos} onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} />

      {/* 编辑对话框 */}
      {editingTodo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">编辑待办</h2>
            <input
              type="text"
              value={editingTodo.text}
              onChange={(e) => setEditingTodo({ ...editingTodo, text: e.target.value })}
              className="w-full px-3 py-2 border rounded mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                保存
              </button>
              <button
                onClick={() => setEditingTodo(null)}
                className="flex-1 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 垃圾桶 */}
      <TrashBin 
        completedCount={completedTodos.length} 
        onOpenDrawer={() => setIsDrawerOpen(true)} 
      />

      {/* 已完成抽屉 */}
      <CompletedDrawer
        isOpen={isDrawerOpen}
        completedTodos={completedTodos}
        onClose={() => setIsDrawerOpen(false)}
        onRestore={handleRestore}
      />
      
      {/* 删除确认弹框 */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除待办"
        message={`确定要删除「${deleteTarget?.text || ""}」吗？此操作不可恢复。`}
        confirmLabel="删除"
        cancelLabel="取消"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
