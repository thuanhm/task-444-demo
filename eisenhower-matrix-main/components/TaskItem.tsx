'use client';

import { Checkbox, Tooltip } from 'antd';
import { EditOutlined, CloseOutlined, BankOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
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

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: id || `${quadrant}-${task.id}`,
    disabled: isDragOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const quadrantColor = QUADRANTS.find((q) => q.id === quadrant)?.color || '#004A8F';
  const statusColor = STATUSES.find((s) => s.id === task.status)?.color || '#5C6B7F';

  const level = deadlineLevel(task, thresholds);
  const left = daysLeft(task.dueDate);
  const dueColor = DEADLINE_COLORS[level];

  const body = (
    <div className="flex items-start gap-2 sm:gap-3">
      <Checkbox
        checked={task.completed}
        onChange={onToggle}
        disabled={isDragOverlay}
        aria-label={t('tasks.toggleTitle')}
        onClick={(e) => e.stopPropagation()}
      />

      <div className="flex-1 min-w-0">
        <p className="task-text text-xs sm:text-sm font-semibold leading-relaxed wrap-break-word select-none text-[#00203F]">
          {task.text}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {task.department && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-sm"
              style={{ backgroundColor: '#004A8F', color: '#FFFFFF' }}
            >
              <BankOutlined /> {task.department}
            </span>
          )}
          {task.assignee && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-sm"
              style={{ backgroundColor: '#EEF2F7', color: '#00203F', border: '1px solid #DCE3EC' }}
            >
              <UserOutlined /> {task.assignee}
            </span>
          )}
          {task.category && (
            <span
              className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-sm"
              style={{ backgroundColor: '#FFFFFF', color: '#5C6B7F', border: '1px solid #DCE3EC' }}
            >
              {task.category}
            </span>
          )}
          <span
            className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded-sm"
            style={{ backgroundColor: statusColor, color: '#FFFFFF' }}
          >
            {t(`status.${task.status}`)}
          </span>
          {task.dueDate && (
            <Tooltip title={t('fields.dueDate')}>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-sm"
                style={{ backgroundColor: dueColor, color: '#FFFFFF' }}
              >
                <CalendarOutlined />
                {formatDate(task.dueDate)}
                {level !== 'none' && left !== null && (
                  <span>
                    (
                    {left < 0
                      ? `${t('tasks.lateBy')} ${Math.abs(left)}`
                      : `${t('tasks.daysLeftShort')} ${left}`}
                    )
                  </span>
                )}
              </span>
            </Tooltip>
          )}
        </div>

        {task.note && <p className="text-[11px] text-[#5C6B7F] mt-1.5 wrap-break-word">{task.note}</p>}
      </div>

      {!isDragOverlay && (
        <div className="flex gap-2 shrink-0">
          <EditOutlined
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-[#00203F] hover:text-[#004A8F] transition-colors cursor-pointer"
            title={t('tasks.editTitle')}
          />
          <CloseOutlined
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-[#EE1C25] hover:opacity-70 transition-colors cursor-pointer"
            title={t('tasks.deleteTitle')}
          />
        </div>
      )}
    </div>
  );

  if (isDragOverlay) {
    return (
      <div
        className={`task-item quadrant-${quadrant} border-2 border-[#00203F] p-3 sm:p-4 bg-white shadow-lg ${
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
      className={`task-item quadrant-${quadrant} border-2 border-[#00203F] p-3 sm:p-4 bg-white ${
        task.completed ? 'completed' : ''
      } ${isDragging ? 'z-50' : ''} cursor-move transition-colors`}
      {...attributes}
      {...listeners}
    >
      {body}
    </div>
  );
}
