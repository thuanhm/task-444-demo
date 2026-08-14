"use client";

import { Task, QuadrantType, DeadlineThresholds } from "@/types";
import { TaskItem } from "./TaskItem";
import { useCommonTranslation } from "@/hooks/useTranslation";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface QuadrantCardProps {
  config: {
    id: QuadrantType;
    title: string;
    subtitle: string;
    color: string;
  };
  tasks: Task[];
  thresholds: DeadlineThresholds;
  onAddTask: () => void;
  onToggleTask: (taskId: number) => void;
  onDeleteTask: (taskId: number) => void;
  onEditTask: (task: Task) => void;
}

export function QuadrantCard({
  config,
  tasks,
  thresholds,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onEditTask,
}: QuadrantCardProps) {
  const { t } = useCommonTranslation();
  const { setNodeRef, isOver } = useDroppable({
    id: config.id,
  });

  const getTitleKey = (id: QuadrantType) => {
    switch (id) {
      case "urgent-important":
        return "quadrants.doFirst.title";
      case "not-urgent-important":
        return "quadrants.schedule.title";
      case "urgent-not-important":
        return "quadrants.delegate.title";
      case "not-urgent-not-important":
        return "quadrants.eliminate.title";
    }
  };

  const getSubtitleKey = (id: QuadrantType) => {
    switch (id) {
      case "urgent-important":
        return "quadrants.doFirst.subtitle";
      case "not-urgent-important":
        return "quadrants.schedule.subtitle";
      case "urgent-not-important":
        return "quadrants.delegate.subtitle";
      case "not-urgent-not-important":
        return "quadrants.eliminate.subtitle";
    }
  };

  const translateOrFallback = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const title = translateOrFallback(getTitleKey(config.id), config.title);
  const subtitle = translateOrFallback(
    getSubtitleKey(config.id),
    config.subtitle
  );

  // Tạo mã định danh duy nhất cho các thẻ có thể sắp xếp
  const sortableItems = tasks.map((task) => `${config.id}-${task.id}`);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    // Nhấn Enter để thêm công việc mới, bỏ qua khi con trỏ đang ở trong ô nhập liệu
    const activeElement = document.activeElement;
    const isInputFocused = activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA";
    if (isInputFocused) return;
    e.preventDefault();
    onAddTask();
  };

  return (
    <div
      className={`bg-white border-2 border-[#003B71] rounded p-4 sm:p-6 transition-all focus:outline-none ${
        isOver ? "bg-[#EEF3F8]" : ""
      }`}
      style={isOver ? { boxShadow: `0 0 0 3px ${config.color}` } : {}}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div
              className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-[#003B71] shrink-0"
              style={{ backgroundColor: config.color }}
            />
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight truncate">
              {title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#7A8FA6]">
            {subtitle} · {tasks.length}
          </p>
        </div>
        <button
          onClick={onAddTask}
          className="px-3 sm:px-4 py-2 rounded-none font-bold text-xs uppercase ml-2 shrink-0 border-2 border-[#003B71] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]"
          style={{
            backgroundColor: config.color,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "4px 4px 0px 0px #003B71";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {t("quadrants.addButton")}
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={
          "drop-zone space-y-2 sm:space-y-3 min-h-[100px] transition-all"
        }
      >
        <SortableContext
          items={sortableItems}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="empty-state text-center py-8 sm:py-12">
              <p className="text-gray-600 text-xs sm:text-sm">
                {t("quadrants.emptyHint")}
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskItem
                key={task.id}
                id={`${config.id}-${task.id}`}
                task={task}
                quadrant={config.id}
                thresholds={thresholds}
                onToggle={() => onToggleTask(task.id)}
                onDelete={() => onDeleteTask(task.id)}
                onEdit={() => onEditTask(task)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
