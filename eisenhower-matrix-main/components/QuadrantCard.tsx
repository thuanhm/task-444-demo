"use client";

import { Card, Button, Empty } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Task, QuadrantType, DeadlineThresholds } from "@/types";
import { TaskItem } from "./TaskItem";
import { useCommonTranslation } from "@/hooks/useTranslation";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface QuadrantCardProps {
  config: { id: QuadrantType; title: string; subtitle: string; color: string };
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
  const { setNodeRef, isOver } = useDroppable({ id: config.id });

  const getTitleKey = (id: QuadrantType) => {
    switch (id) {
      case "urgent-important": return "quadrants.doFirst.title";
      case "not-urgent-important": return "quadrants.schedule.title";
      case "urgent-not-important": return "quadrants.delegate.title";
      case "not-urgent-not-important": return "quadrants.eliminate.title";
    }
  };
  const getSubtitleKey = (id: QuadrantType) => {
    switch (id) {
      case "urgent-important": return "quadrants.doFirst.subtitle";
      case "not-urgent-important": return "quadrants.schedule.subtitle";
      case "urgent-not-important": return "quadrants.delegate.subtitle";
      case "not-urgent-not-important": return "quadrants.eliminate.subtitle";
    }
  };
  const translateOrFallback = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const title = translateOrFallback(getTitleKey(config.id), config.title);
  const subtitle = translateOrFallback(getSubtitleKey(config.id), config.subtitle);

  const sortableItems = tasks.map((task) => `${config.id}-${task.id}`);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    const activeElement = document.activeElement;
    const isInputFocused = activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA";
    if (isInputFocused) return;
    e.preventDefault();
    onAddTask();
  };

  return (
    <Card
      style={{
        border: "1px solid #DCE3EC",
        borderRadius: 8,
        boxShadow: isOver ? `0 0 0 2px ${config.color}` : "0 1px 3px rgba(0,32,63,0.08)",
        transition: "box-shadow 150ms ease",
      }}
      styles={{ body: { padding: '16px 20px' } }}
      className={isOver ? "bg-[#EEF2F7]" : ""}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div
              className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm shrink-0"
              style={{ backgroundColor: config.color }}
            />
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight truncate text-[#00203F]">
              {title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#5C6B7F]">
            {subtitle} · {tasks.length}
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAddTask}
          style={{ backgroundColor: config.color, borderColor: config.color }}
        >
          {t("quadrants.addButton")}
        </Button>
      </div>

      <div ref={setNodeRef} className="drop-zone space-y-2 sm:space-y-3 min-h-[100px] transition-all">
        <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <Empty
              description={t("quadrants.emptyHint")}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className="py-8 sm:py-12"
            />
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
    </Card>
  );
}
