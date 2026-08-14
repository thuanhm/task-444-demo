'use client';

import { Modal, Table, InputNumber, Space, Statistic, Row, Col, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCommonTranslation } from '@/hooks/useTranslation';
import { DEADLINE_COLORS } from '@/constants';
import { atRiskTasks, formatDate } from '@/lib/taskUtils';
import type { DeadlineLevel, DeadlineThresholds, TasksByQuadrant } from '@/types';

interface DeadlineAlertModalProps {
  isOpen: boolean;
  tasks: TasksByQuadrant;
  thresholds: DeadlineThresholds;
  onChangeThresholds: (thresholds: DeadlineThresholds) => void;
  onClose: () => void;
}

interface Row {
  id: number;
  text: string;
  department: string;
  assignee: string;
  dueDate: string;
  left: number;
  status: string;
  level: DeadlineLevel;
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

  const rows: Row[] = atRiskTasks(tasks, thresholds);
  const overdue = rows.filter((row) => row.level === 'overdue').length;
  const red = rows.filter((row) => row.level === 'red').length;
  const amber = rows.filter((row) => row.level === 'amber').length;

  const columns: ColumnsType<Row> = [
    { title: t('fields.content'), dataIndex: 'text', key: 'text' },
    { title: t('fields.department'), dataIndex: 'department', key: 'department', width: 160,
      render: (v: string) => v || '—' },
    { title: t('fields.assignee'), dataIndex: 'assignee', key: 'assignee', width: 140,
      render: (v: string) => v || '—' },
    {
      title: t('fields.dueDate'), dataIndex: 'dueDate', key: 'dueDate', width: 110, align: 'center',
      render: (v: string) => formatDate(v),
    },
    {
      title: t('modals.deadline.daysLeft'), dataIndex: 'left', key: 'left', width: 90, align: 'center',
      render: (v: number) => <strong>{v}</strong>,
    },
    {
      title: t('fields.status'), dataIndex: 'status', key: 'status', width: 130, align: 'center',
      render: (v: string) => t(`status.${v}`),
    },
  ];

  return (
    <Modal
      title={`🔔 ${t('modals.deadline.title')}`}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnHidden
    >
      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <Statistic
            title={t('modals.deadline.overdue')}
            value={overdue}
            valueStyle={{ color: DEADLINE_COLORS.overdue }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title={t('modals.deadline.urgent')}
            value={red}
            valueStyle={{ color: DEADLINE_COLORS.red }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title={t('modals.deadline.soon')}
            value={amber}
            valueStyle={{ color: DEADLINE_COLORS.amber }}
          />
        </Col>
      </Row>

      <Space className="mb-4" size={16} wrap>
        <span className="text-sm text-[#00203F]">
          {t('modals.deadline.redThreshold')}
          <InputNumber
            min={0}
            max={60}
            value={thresholds.red}
            onChange={(value) => onChangeThresholds({ ...thresholds, red: Number(value) || 0 })}
            className="ml-2"
            style={{ width: 70 }}
          />
        </span>
        <span className="text-sm text-[#00203F]">
          {t('modals.deadline.amberThreshold')}
          <InputNumber
            min={0}
            max={90}
            value={thresholds.amber}
            onChange={(value) => onChangeThresholds({ ...thresholds, amber: Number(value) || 0 })}
            className="ml-2"
            style={{ width: 70 }}
          />
        </span>
      </Space>

      {rows.length === 0 ? (
        <Empty description={t('modals.deadline.empty')} />
      ) : (
        <Table<Row>
          columns={columns}
          dataSource={rows}
          rowKey="id"
          size="small"
          pagination={rows.length > 10 ? { pageSize: 10 } : false}
          scroll={{ x: true }}
          rowClassName={(record) =>
            record.level === 'overdue'
              ? 'bg-[#F9D6D6]'
              : record.level === 'red'
              ? 'bg-[#FBE2E2]'
              : 'bg-[#F7ECD9]'
          }
        />
      )}
    </Modal>
  );
}
