'use client';

import { useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { TasksByQuadrant, QuadrantType, DeadlineThresholds } from '@/types';
import { QUADRANTS, COLORS, DEADLINE_COLORS } from '@/constants';
import { useCommonTranslation } from '@/hooks/useTranslation';
import { statsByDepartment, summarize, flattenBoard, formatDate } from '@/lib/taskUtils';
import { quadrantKey } from '@/components/TaskFormModal';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TasksByQuadrant;
  thresholds: DeadlineThresholds;
}

export function StatisticsModal({
  isOpen,
  onClose,
  tasks,
  thresholds,
}: StatisticsModalProps) {
  const [view, setView] = useState<'department' | 'chart' | 'list'>('department');
  const { t } = useCommonTranslation();

  if (!isOpen) return null;

  const summary = summarize(tasks, thresholds);
  const byDepartment = statsByDepartment(tasks, thresholds);
  const quadrantTitle = (id: QuadrantType) => t(`quadrants.${quadrantKey(id)}.title`);

  const pieData = {
    labels: QUADRANTS.map((q) => quadrantTitle(q.id)),
    datasets: [
      {
        data: QUADRANTS.map((q) => tasks[q.id].length),
        backgroundColor: QUADRANTS.map((q) => q.color),
        borderColor: COLORS.navy,
        borderWidth: 2,
      },
    ],
  };

  // Biểu đồ theo phòng phụ trách - phần quan trọng nhất với phòng tổng hợp
  const departmentData = {
    labels: byDepartment.map((row) => row.department),
    datasets: [
      {
        label: t('modals.statistics.completed'),
        data: byDepartment.map((row) => row.done),
        backgroundColor: COLORS.green,
        borderColor: COLORS.navy,
        borderWidth: 2,
      },
      {
        label: t('modals.statistics.pending'),
        data: byDepartment.map((row) => row.total - row.done),
        backgroundColor: COLORS.blue,
        borderColor: COLORS.navy,
        borderWidth: 2,
      },
      {
        label: t('summary.overdue'),
        data: byDepartment.map((row) => row.overdue),
        backgroundColor: DEADLINE_COLORS.overdue,
        borderColor: COLORS.navy,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { font: { family: 'Inter', size: 12, weight: 'bold' as const }, padding: 12 },
      },
      tooltip: { backgroundColor: COLORS.navy, padding: 10, cornerRadius: 4 },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#D6E2EE' } },
      x: { grid: { display: false } },
    },
  };

  const tabClass = (active: boolean) =>
    `${active ? 'btn-blue' : 'btn-white'} flex-1 sm:flex-initial px-4 py-2 font-bold text-xs sm:text-sm uppercase`;

  return (
    <div className="fixed inset-0 bg-[#003B71]/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white border-2 border-[#003B71] max-w-6xl w-full my-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sticky top-0 bg-white border-b-2 border-[#003B71] z-10">
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-[#003B71]">
            {t('modals.statistics.title')}
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
          {/* Số liệu tổng hợp */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: t('modals.statistics.totalTasks'), value: summary.total, color: COLORS.navy },
              { label: t('modals.statistics.completed'), value: summary.done, color: COLORS.green },
              { label: t('modals.statistics.pending'), value: summary.total - summary.done, color: COLORS.blue },
              {
                label: t('modals.statistics.completionRate'),
                value: `${summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0}%`,
                color: COLORS.gold,
              },
            ].map((item) => (
              <div key={item.label} className="bg-[#EEF3F8] border-2 border-[#003B71] p-3 text-center">
                <div className="text-2xl sm:text-3xl font-bold" style={{ color: item.color }}>
                  {item.value}
                </div>
                <div className="text-xs text-[#7A8FA6] mt-1">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 sm:gap-3 mb-6">
            <button onClick={() => setView('department')} className={tabClass(view === 'department')}>
              🏢 {t('modals.statistics.byDepartment')}
            </button>
            <button onClick={() => setView('chart')} className={tabClass(view === 'chart')}>
              📊 {t('modals.statistics.chartView')}
            </button>
            <button onClick={() => setView('list')} className={tabClass(view === 'list')}>
              📋 {t('modals.statistics.listView')}
            </button>
          </div>

          {/* Theo phòng phụ trách */}
          {view === 'department' && (
            <div className="space-y-6">
              <div className="bg-white border-2 border-[#003B71] p-4">
                <h3 className="text-base sm:text-lg font-bold text-[#003B71] mb-3">
                  {t('modals.statistics.byDepartment')}
                </h3>
                {byDepartment.length === 0 ? (
                  <p className="text-sm text-[#7A8FA6] py-6 text-center">
                    {t('modals.statistics.noTasks')}
                  </p>
                ) : (
                  <div className="relative" style={{ height: '280px' }}>
                    <Bar data={departmentData} options={barOptions} />
                  </div>
                )}
              </div>

              {byDepartment.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#DCEBF8] text-[#003B71]">
                        <th className="border border-[#003B71] px-2 py-1.5 text-left">
                          {t('fields.department')}
                        </th>
                        <th className="border border-[#003B71] px-2 py-1.5">
                          {t('modals.statistics.summaryTotal')}
                        </th>
                        <th className="border border-[#003B71] px-2 py-1.5">
                          {t('status.dang-lam')}
                        </th>
                        <th className="border border-[#003B71] px-2 py-1.5">
                          {t('status.hoan-thanh')}
                        </th>
                        <th className="border border-[#003B71] px-2 py-1.5">
                          {t('summary.overdue')}
                        </th>
                        <th className="border border-[#003B71] px-2 py-1.5">
                          {t('modals.statistics.completionRate')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {byDepartment.map((row) => (
                        <tr key={row.department}>
                          <td className="border border-[#003B71] px-2 py-1.5 font-semibold text-[#003B71]">
                            {row.department}
                          </td>
                          <td className="border border-[#003B71] px-2 py-1.5 text-center">{row.total}</td>
                          <td className="border border-[#003B71] px-2 py-1.5 text-center">{row.inProgress}</td>
                          <td className="border border-[#003B71] px-2 py-1.5 text-center text-[#0E9F6E] font-semibold">
                            {row.done}
                          </td>
                          <td
                            className="border border-[#003B71] px-2 py-1.5 text-center font-semibold"
                            style={{ color: row.overdue > 0 ? DEADLINE_COLORS.overdue : undefined }}
                          >
                            {row.overdue}
                          </td>
                          <td className="border border-[#003B71] px-2 py-1.5 text-center">
                            {Math.round((row.done / row.total) * 100)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Biểu đồ theo nhóm ưu tiên */}
          {view === 'chart' && (
            <div className="bg-white border-2 border-[#003B71] p-4">
              <h3 className="text-base sm:text-lg font-bold text-[#003B71] mb-3">
                {t('modals.statistics.tasksByQuadrant')}
              </h3>
              <div className="relative" style={{ height: '280px' }}>
                <Doughnut data={pieData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Danh sách chi tiết */}
          {view === 'list' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#DCEBF8] text-[#003B71]">
                    <th className="border border-[#003B71] px-2 py-1.5 text-left">{t('fields.content')}</th>
                    <th className="border border-[#003B71] px-2 py-1.5 text-left">{t('fields.department')}</th>
                    <th className="border border-[#003B71] px-2 py-1.5 text-left">{t('fields.assignee')}</th>
                    <th className="border border-[#003B71] px-2 py-1.5">{t('fields.dueDate')}</th>
                    <th className="border border-[#003B71] px-2 py-1.5">{t('fields.quadrant')}</th>
                    <th className="border border-[#003B71] px-2 py-1.5">{t('fields.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {flattenBoard(tasks).map((task) => (
                    <tr key={task.id}>
                      <td className="border border-[#003B71] px-2 py-1.5">{task.text}</td>
                      <td className="border border-[#003B71] px-2 py-1.5">{task.department || '—'}</td>
                      <td className="border border-[#003B71] px-2 py-1.5">{task.assignee || '—'}</td>
                      <td className="border border-[#003B71] px-2 py-1.5 text-center whitespace-nowrap">
                        {formatDate(task.dueDate) || '—'}
                      </td>
                      <td className="border border-[#003B71] px-2 py-1.5 text-center">
                        {quadrantTitle(task.quadrant)}
                      </td>
                      <td className="border border-[#003B71] px-2 py-1.5 text-center whitespace-nowrap">
                        {t(`status.${task.status}`)}
                      </td>
                    </tr>
                  ))}
                  {summary.total === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-[#7A8FA6] py-6">
                        {t('modals.statistics.noTasks')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
