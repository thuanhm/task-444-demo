'use client';

import { Task, QuadrantType, DeadlineThresholds } from '@/types';
import { QUADRANTS, DEADLINE_COLORS, STATUSES } from '@/constants';
import { deadlineLevel, formatDate, daysLeft } from '@/lib/taskUtils';
import { useCommonTranslation } from '@/hooks/useTranslation';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskItemProps {
  id?: string;
  task: Task;
  quadrant: QuadrantType;
  thresholds: DeadlineThresholds;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isDragOverlay?: boolean;
}

export function TaskItem({
  id,
  task,
  quadrant,
  thresholds,
  onToggle,
  onDelete,
  onEdit,
  isDragOverlay = false,
}: TaskItemProps) {
  const { t } = useCommonTranslation();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: id || `${quadrant}-${task.id}`,
      disabled: isDragOverlay,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const quadrantColor =
    QUADRANTS.find((q) => q.id === quadrant)?.color || '#0072BC';
  const statusColor =
    STATUSES.find((s) => s.id === task.status)?.color || '#7A8FA6';

  // Mức cảnh báo hạn chót quyết định màu của thẻ ngày
  const level = deadlineLevel(task, thresholds);
  const left = daysLeft(task.dueDate);
  const dueColor = DEADLINE_COLORS[level];

  const body = (
    <>
      <div className="flex items-start gap-2 sm:gap-3">
        <input
          type="checkbox"
          className="custom-checkbox mt-0.5"
          checked={task.completed}
          onChange={onToggle}
          disabled={isDragOverlay}
          aria-label={t('tasks.toggleTitle')}
        />

        <div className="flex-1 min-w-0">
          <p className="task-text text-xs sm:text-sm font-semibold leading-relaxed wrap-break-word select-none text-[#003B71]">
            {task.text}
          </p>

          {/* Các thẻ thông tin: phòng phụ trách, cán bộ, loại việc */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {task.department && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-[#DCEBF8] text-[#003B71] border border-[#0072BC]">
                🏢 {task.department}
              </span>
            )}
            {task.assignee && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#EEF3F8] text-[#003B71] border border-[#B7C4D2]">
                👤 {task.assignee}
              </span>
            )}
            {task.category && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-white text-[#7A8FA6] border border-[#B7C4D2]">
                {task.category}
              </span>
            )}
            <span
              className="px-1.5 py-0.5 text-[10px] font-bold text-white"
              style={{ backgroundColor: statusColor }}
            >
              {t(`status.${task.status}`)}
            </span>
            {task.dueDate && (
              <span
                className="px-1.5 py-0.5 text-[10px] font-bold text-white"
                style={{ backgroundColor: dueColor }}
                title={t('fields.dueDate')}
              >
                📅 {formatDate(task.dueDate)}
                {level !== 'none' && left !== null && (
                  <span className="ml-1">
                    ({left < 0 ? `${t('tasks.lateBy')} ${Math.abs(left)}` : `${t('tasks.daysLeftShort')} ${left}`})
                  </span>
                )}
              </span>
            )}
          </div>

          {task.note && (
            <p className="text-[11px] text-[#7A8FA6] mt-1.5 wrap-break-word">
              {task.note}
            </p>
          )}
        </div>

        {!isDragOverlay && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onEdit}
              className="text-[#003B71] font-bold text-base cursor-pointer hover:text-[#0072BC] transition-colors"
              title={t('tasks.editTitle')}
            >
              ✎
            </button>
            <button
              onClick={onDelete}
              className="text-[#E31837] hover:opacity-70 font-bold text-lg cursor-pointer transition-colors"
              title={t('tasks.deleteTitle')}
            >
              ×
            </button>
          </div>
        )}
      </div>
    </>
  );

  if (isDragOverlay) {
    return (
      <div
        className={`task-item quadrant-${quadrant} border-2 border-[#003B71] p-3 sm:p-4 bg-white shadow-lg ${
          task.completed ? 'completed' : ''
        }`}
        style={{ borderLeftColor: quadrantColor, borderLeftWidth: '4px' }}
      >
        {body}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-item quadrant-${quadrant} border-2 border-[#003B71] p-3 sm:p-4 bg-white ${
        task.completed ? 'completed' : ''
      } ${isDragging ? 'z-50' : ''} cursor-move transition-colors`}
      {...attributes}
      {...listeners}
    >
      {body}
    </div>
  );
}
