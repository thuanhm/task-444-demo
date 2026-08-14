'use client';

import { useCommonTranslation } from '@/hooks/useTranslation';
import { DEADLINE_COLORS } from '@/constants';
import { atRiskTasks, formatDate } from '@/lib/taskUtils';
import type { DeadlineThresholds, TasksByQuadrant } from '@/types';

interface DeadlineAlertModalProps {
  isOpen: boolean;
  tasks: TasksByQuadrant;
  thresholds: DeadlineThresholds;
  onChangeThresholds: (thresholds: DeadlineThresholds) => void;
  onClose: () => void;
}

/** Bảng cảnh báo công việc quá hạn và sắp đến hạn */
export function DeadlineAlertModal({
  isOpen,
  tasks,
  thresholds,
  onChangeThresholds,
  onClose,
}: DeadlineAlertModalProps) {
  const { t } = useCommonTranslation();
  if (!isOpen) return null;

  const rows = atRiskTasks(tasks, thresholds);
  const overdue = rows.filter((row) => row.level === 'overdue').length;
  const red = rows.filter((row) => row.level === 'red').length;
  const amber = rows.filter((row) => row.level === 'amber').length;

  return (
    <div className="fixed inset-0 bg-[#003B71]/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white border-2 border-[#003B71] max-w-5xl w-full my-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sticky top-0 bg-white border-b-2 border-[#003B71]">
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-[#003B71]">
            🔔 {t('modals.deadline.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-[#003B71] hover:opacity-70 text-2xl font-bold"
            aria-label={t('actions.close')}
          >
            ×
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4">
          <p className="text-xs sm:text-sm text-[#003B71] mb-3">
            <span className="font-bold" style={{ color: DEADLINE_COLORS.overdue }}>
              {t('modals.deadline.overdue')}: {overdue}
            </span>
            {' • '}
            <span className="font-bold" style={{ color: DEADLINE_COLORS.red }}>
              {t('modals.deadline.urgent')}: {red}
            </span>
            {' • '}
            <span className="font-bold" style={{ color: DEADLINE_COLORS.amber }}>
              {t('modals.deadline.soon')}: {amber}
            </span>
          </p>

          {/* Cho phép tự đặt ngưỡng cảnh báo giống công cụ trên máy trạm */}
          <div className="flex flex-wrap items-end gap-3 mb-4 text-xs sm:text-sm text-[#003B71]">
            <label className="flex items-center gap-2">
              {t('modals.deadline.redThreshold')}
              <input
                type="number"
                min={0}
                max={60}
                value={thresholds.red}
                onChange={(e) =>
                  onChangeThresholds({
                    ...thresholds,
                    red: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="w-16 px-2 py-1 border-2 border-[#003B71]"
              />
            </label>
            <label className="flex items-center gap-2">
              {t('modals.deadline.amberThreshold')}
              <input
                type="number"
                min={0}
                max={90}
                value={thresholds.amber}
                onChange={(e) =>
                  onChangeThresholds({
                    ...thresholds,
                    amber: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="w-16 px-2 py-1 border-2 border-[#003B71]"
              />
            </label>
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-[#7A8FA6] py-6 text-center">
              {t('modals.deadline.empty')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#DCEBF8] text-[#003B71]">
                    <th className="border border-[#003B71] px-2 py-1.5 text-left">
                      {t('fields.content')}
                    </th>
                    <th className="border border-[#003B71] px-2 py-1.5 text-left">
                      {t('fields.department')}
                    </th>
                    <th className="border border-[#003B71] px-2 py-1.5 text-left">
                      {t('fields.assignee')}
                    </th>
                    <th className="border border-[#003B71] px-2 py-1.5 whitespace-nowrap">
                      {t('fields.dueDate')}
                    </th>
                    <th className="border border-[#003B71] px-2 py-1.5 whitespace-nowrap">
                      {t('modals.deadline.daysLeft')}
                    </th>
                    <th className="border border-[#003B71] px-2 py-1.5 whitespace-nowrap">
                      {t('fields.status')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      style={{
                        backgroundColor:
                          row.level === 'overdue'
                            ? '#F8D2D8'
                            : row.level === 'red'
                            ? '#FDE7EA'
                            : '#FEF3DC',
                      }}
                    >
                      <td className="border border-[#003B71] px-2 py-1.5">{row.text}</td>
                      <td className="border border-[#003B71] px-2 py-1.5">
                        {row.department || '—'}
                      </td>
                      <td className="border border-[#003B71] px-2 py-1.5">
                        {row.assignee || '—'}
                      </td>
                      <td className="border border-[#003B71] px-2 py-1.5 text-center whitespace-nowrap">
                        {formatDate(row.dueDate)}
                      </td>
                      <td className="border border-[#003B71] px-2 py-1.5 text-center font-bold">
                        {row.left}
                      </td>
                      <td className="border border-[#003B71] px-2 py-1.5 text-center whitespace-nowrap">
                        {t(`status.${row.status}`)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
