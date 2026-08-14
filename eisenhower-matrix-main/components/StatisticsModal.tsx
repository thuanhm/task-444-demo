'use client';

import { useState } from 'react';
import { Modal, Tabs, Row, Col, Statistic, Table, Progress } from 'antd';
import type { ColumnsType } from 'antd/es/table';
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
import { TasksByQuadrant, QuadrantType, DeadlineThresholds, Task } from '@/types';
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

interface DepartmentRow {
  department: string;
  total: number;
  done: number;
  inProgress: number;
  overdue: number;
}

export function StatisticsModal({ isOpen, onClose, tasks, thresholds }: StatisticsModalProps) {
  const [view, setView] = useState('department');
  const { t } = useCommonTranslation();

  if (!isOpen) return null;

  const summary = summarize(tasks, thresholds);
  const byDepartment = statsByDepartment(tasks, thresholds) as DepartmentRow[];
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

  const departmentChartData = {
    labels: byDepartment.map((row) => row.department),
    datasets: [
      { label: t('modals.statistics.completed'), data: byDepartment.map((r) => r.done), backgroundColor: COLORS.green, borderColor: COLORS.navy, borderWidth: 2 },
      { label: t('modals.statistics.pending'), data: byDepartment.map((r) => r.total - r.done), backgroundColor: COLORS.blue, borderColor: COLORS.navy, borderWidth: 2 },
      { label: t('summary.overdue'), data: byDepartment.map((r) => r.overdue), backgroundColor: DEADLINE_COLORS.overdue, borderColor: COLORS.navy, borderWidth: 2 },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { font: { family: 'Inter', size: 12, weight: 'bold' as const }, padding: 12 } },
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

  const departmentColumns: ColumnsType<DepartmentRow> = [
    { title: t('fields.department'), dataIndex: 'department', key: 'department',
      render: (v) => <strong className="text-[#00203F]">{v}</strong> },
    { title: t('modals.statistics.summaryTotal'), dataIndex: 'total', key: 'total', align: 'center', width: 90 },
    { title: t('status.dang-lam'), dataIndex: 'inProgress', key: 'inProgress', align: 'center', width: 100 },
    { title: t('status.hoan-thanh'), dataIndex: 'done', key: 'done', align: 'center', width: 100,
      render: (v) => <span style={{ color: COLORS.green, fontWeight: 600 }}>{v}</span> },
    { title: t('summary.overdue'), dataIndex: 'overdue', key: 'overdue', align: 'center', width: 90,
      render: (v) => <span style={{ color: v > 0 ? DEADLINE_COLORS.overdue : undefined, fontWeight: 600 }}>{v}</span> },
    {
      title: t('modals.statistics.completionRate'), key: 'rate', width: 160,
      render: (_, row) => (
        <Progress
          percent={row.total > 0 ? Math.round((row.done / row.total) * 100) : 0}
          size="small"
          strokeColor={COLORS.blue}
        />
      ),
    },
  ];

  const listColumns: ColumnsType<Task & { quadrant: QuadrantType }> = [
    { title: t('fields.content'), dataIndex: 'text', key: 'text' },
    { title: t('fields.department'), dataIndex: 'department', key: 'department', width: 150, render: (v) => v || '—' },
    { title: t('fields.assignee'), dataIndex: 'assignee', key: 'assignee', width: 130, render: (v) => v || '—' },
    { title: t('fields.dueDate'), dataIndex: 'dueDate', key: 'dueDate', width: 110, align: 'center', render: (v) => formatDate(v) || '—' },
    { title: t('fields.quadrant'), dataIndex: 'quadrant', key: 'quadrant', width: 170, align: 'center', render: (v) => quadrantTitle(v) },
    { title: t('fields.status'), dataIndex: 'status', key: 'status', width: 120, align: 'center', render: (v) => t(`status.${v}`) },
  ];

  return (
    <Modal
      title={t('modals.statistics.title')}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={1000}
      destroyOnHidden
    >
      <Row gutter={16} className="mb-6">
        <Col xs={12} lg={6}>
          <Statistic title={t('modals.statistics.totalTasks')} value={summary.total} valueStyle={{ color: COLORS.navy }} />
        </Col>
        <Col xs={12} lg={6}>
          <Statistic title={t('modals.statistics.completed')} value={summary.done} valueStyle={{ color: COLORS.green }} />
        </Col>
        <Col xs={12} lg={6}>
          <Statistic title={t('modals.statistics.pending')} value={summary.total - summary.done} valueStyle={{ color: COLORS.blue }} />
        </Col>
        <Col xs={12} lg={6}>
          <Statistic
            title={t('modals.statistics.completionRate')}
            value={summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0}
            suffix="%"
            valueStyle={{ color: COLORS.gold }}
          />
        </Col>
      </Row>

      <Tabs
        activeKey={view}
        onChange={setView}
        items={[
          {
            key: 'department',
            label: `🏢 ${t('modals.statistics.byDepartment')}`,
            children: (
              <div className="space-y-6">
                <div style={{ height: 280 }}>
                  <Bar data={departmentChartData} options={barOptions} />
                </div>
                <Table<DepartmentRow>
                  columns={departmentColumns}
                  dataSource={byDepartment}
                  rowKey="department"
                  size="small"
                  pagination={false}
                  scroll={{ x: true }}
                />
              </div>
            ),
          },
          {
            key: 'chart',
            label: `📊 ${t('modals.statistics.chartView')}`,
            children: (
              <div style={{ height: 300 }}>
                <Doughnut data={pieData} options={chartOptions} />
              </div>
            ),
          },
          {
            key: 'list',
            label: `📋 ${t('modals.statistics.listView')}`,
            children: (
              <Table
                columns={listColumns}
                dataSource={flattenBoard(tasks)}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 10 }}
                scroll={{ x: true }}
              />
            ),
          },
        ]}
      />
    </Modal>
  );
}
