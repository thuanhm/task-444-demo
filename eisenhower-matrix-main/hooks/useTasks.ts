'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TasksByQuadrant, QuadrantType, Task, TaskInput } from '@/types';
import { apiFetch, ApiError } from '@/lib/apiClient';
import { useAccess } from '@/components/AccessGate';

const emptyBoard = (): TasksByQuadrant => ({
  'urgent-important': [],
  'not-urgent-important': [],
  'urgent-not-important': [],
  'not-urgent-not-important': [],
});

/**
 * Quản lý công việc dùng chung, dữ liệu lưu trên Neon (PostgreSQL).
 * Giao diện cập nhật ngay (optimistic), sau đó đồng bộ với máy chủ;
 * nếu máy chủ báo lỗi thì tải lại dữ liệu thật để tránh lệch.
 */
export function useTasks() {
  const { accessKey, signOut } = useAccess();
  const [tasks, setTasks] = useState<TasksByQuadrant>(emptyBoard());
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(0);

  const loadTasks = useCallback(async () => {
    try {
      const data = await apiFetch<{ tasks: TasksByQuadrant }>('/api/tasks', accessKey);
      setTasks(data.tasks);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        signOut();
        return;
      }
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu.');
    } finally {
      setIsLoading(false);
    }
  }, [accessKey, signOut]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Tự làm mới khi quay lại tab để thấy thay đổi của người khác
  useEffect(() => {
    const handleFocus = () => loadTasks();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadTasks]);

  const sync = useCallback(
    async (run: () => Promise<unknown>) => {
      pending.current += 1;
      setIsSyncing(true);
      try {
        await run();
        setError(null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          return;
        }
        setError(err instanceof Error ? err.message : 'Không lưu được thay đổi.');
        await loadTasks();
      } finally {
        pending.current -= 1;
        if (pending.current === 0) setIsSyncing(false);
      }
    },
    [loadTasks, signOut],
  );

  // Lưu lại nhóm và thứ tự hiện tại của toàn bộ bảng
  const persistOrder = useCallback(
    (board: TasksByQuadrant) => {
      const order = Object.fromEntries(
        (Object.keys(board) as QuadrantType[]).map((q) => [
          q,
          board[q].map((task) => task.id),
        ]),
      );

      return sync(() =>
        apiFetch('/api/tasks/reorder', accessKey, {
          method: 'POST',
          body: JSON.stringify({ order }),
        }),
      );
    },
    [accessKey, sync],
  );

  const addTask = useCallback(
    (quadrant: QuadrantType, input: TaskInput) => {
      const content = input.text.trim();
      if (!content) return;

      const tempId = -Date.now();
      const optimistic: Task = {
        ...input,
        id: tempId,
        text: content,
        completed: input.status === 'hoan-thanh',
      };

      setTasks((prev) => ({ ...prev, [quadrant]: [optimistic, ...prev[quadrant]] }));

      sync(async () => {
        const data = await apiFetch<{ task: Task }>('/api/tasks', accessKey, {
          method: 'POST',
          body: JSON.stringify({ ...input, text: content, quadrant }),
        });

        setTasks((prev) => ({
          ...prev,
          [quadrant]: prev[quadrant].map((task) =>
            task.id === tempId ? data.task : task,
          ),
        }));
      });
    },
    [accessKey, sync],
  );

  /** Cập nhật một phần thông tin của công việc */
  const updateTask = useCallback(
    (quadrant: QuadrantType, taskId: number, patch: Partial<TaskInput>) => {
      setTasks((prev) => ({
        ...prev,
        [quadrant]: prev[quadrant].map((task) =>
          task.id === taskId
            ? {
                ...task,
                ...patch,
                completed:
                  patch.status !== undefined
                    ? patch.status === 'hoan-thanh'
                    : task.completed,
              }
            : task,
        ),
      }));

      sync(() =>
        apiFetch(`/api/tasks/${taskId}`, accessKey, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        }),
      );
    },
    [accessKey, sync],
  );

  const deleteTask = useCallback(
    (quadrant: QuadrantType, taskId: number) => {
      setTasks((prev) => ({
        ...prev,
        [quadrant]: prev[quadrant].filter((task) => task.id !== taskId),
      }));

      sync(() => apiFetch(`/api/tasks/${taskId}`, accessKey, { method: 'DELETE' }));
    },
    [accessKey, sync],
  );

  /** Bấm ô tích: chuyển qua lại giữa "Hoàn thành" và "Đang làm" */
  const toggleTask = useCallback(
    (quadrant: QuadrantType, taskId: number) => {
      const current = tasks[quadrant].find((task) => task.id === taskId);
      const nextStatus = current?.status === 'hoan-thanh' ? 'dang-lam' : 'hoan-thanh';
      updateTask(quadrant, taskId, { status: nextStatus });
    },
    [tasks, updateTask],
  );

  const editTask = useCallback(
    (quadrant: QuadrantType, taskId: number, newText: string) => {
      const content = newText.trim();
      if (!content) return;
      updateTask(quadrant, taskId, { text: content });
    },
    [updateTask],
  );

  const moveTask = useCallback(
    (
      fromQuadrant: QuadrantType,
      toQuadrant: QuadrantType,
      taskId: number,
      targetIndex?: number,
    ) => {
      let nextBoard: TasksByQuadrant | null = null;

      setTasks((prev) => {
        const taskIndex = prev[fromQuadrant].findIndex((t) => t.id === taskId);
        if (taskIndex === -1) return prev;

        const task = prev[fromQuadrant][taskIndex];
        const newFrom = [...prev[fromQuadrant]];
        newFrom.splice(taskIndex, 1);

        if (fromQuadrant === toQuadrant) {
          const insertIndex =
            targetIndex !== undefined
              ? targetIndex > taskIndex
                ? targetIndex - 1
                : targetIndex
              : newFrom.length;
          newFrom.splice(insertIndex, 0, task);
          nextBoard = { ...prev, [fromQuadrant]: newFrom };
          return nextBoard;
        }

        const newTo = [...prev[toQuadrant]];
        const insertIndex = targetIndex !== undefined ? targetIndex : newTo.length;
        newTo.splice(insertIndex, 0, task);

        nextBoard = { ...prev, [fromQuadrant]: newFrom, [toQuadrant]: newTo };
        return nextBoard;
      });

      if (nextBoard) persistOrder(nextBoard);
    },
    [persistOrder],
  );

  const clearAllTasks = useCallback(() => {
    setTasks(emptyBoard());
    sync(() => apiFetch('/api/tasks', accessKey, { method: 'DELETE' }));
  }, [accessKey, sync]);

  /** Nhập hàng loạt từ tệp Excel/CSV */
  const importTasks = useCallback(
    async (rows: (TaskInput & { quadrant: QuadrantType })[]) => {
      const data = await apiFetch<{ inserted: number }>('/api/tasks/import', accessKey, {
        method: 'POST',
        body: JSON.stringify({ tasks: rows }),
      });
      await loadTasks();
      return data.inserted;
    },
    [accessKey, loadTasks],
  );

  return {
    tasks,
    isLoading,
    isSyncing,
    error,
    reload: loadTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    editTask,
    moveTask,
    clearAllTasks,
    importTasks,
  };
}
