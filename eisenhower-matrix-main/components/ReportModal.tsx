'use client';

import { useMemo, useState } from 'react';
import { Modal, Form, Input, Select, Button, Space, Alert, Typography } from 'antd';
import { FileTextOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { useCommonTranslation } from '@/hooks/useTranslation';
import { useAccess } from '@/components/AccessGate';
import { apiFetch } from '@/lib/apiClient';
import { flattenBoard, daysLeft } from '@/lib/taskUtils';
import type { ReportOptions } from '@/lib/reportPrompt';
import type { TasksByQuadrant } from '@/types';

const { TextArea } = Input;

interface ReportModalProps {
  isOpen: boolean;
  tasks: TasksByQuadrant;
  onClose: () => void;
}

const PERIODS = ['Báo cáo tuần', 'Báo cáo tháng', 'Báo cáo quý', 'Báo cáo đột xuất'];

/** Hộp thoại tạo báo cáo hành chính bằng AI từ dữ liệu đang hiển thị */
export function ReportModal({ isOpen, tasks, onClose }: ReportModalProps) {
  const { t } = useCommonTranslation();
  const { accessKey } = useAccess();
  const [form] = Form.useForm<ReportOptions>();

  const [report, setReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const payloadTasks = useMemo(
    () => flattenBoard(tasks).map((task) => ({ ...task, daysLeft: daysLeft(task.dueDate) })),
    [tasks],
  );

  if (!isOpen) return null;

  const handleGenerate = async (options: ReportOptions) => {
    setIsGenerating(true);
    setError(null);
    setReport('');

    try {
      const data = await apiFetch<{ report: string }>('/api/report', accessKey, {
        method: 'POST',
        body: JSON.stringify({ tasks: payloadTasks, options }),
      });
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được báo cáo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'Times New Roman',serif;font-size:13pt;line-height:1.5;white-space:pre-wrap">
${report.replace(/&/g, '&amp;').replace(/</g, '&lt;')}
</body></html>`;
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bao-cao-nhiem-vu-${new Date().toISOString().slice(0, 10)}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      title={<>🖋 {t('modals.report.title')}</>}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
        {t('modals.report.scope')} <strong>{payloadTasks.length}</strong> {t('modals.report.scopeUnit')}
      </Typography.Paragraph>

      <Form<ReportOptions>
        form={form}
        layout="vertical"
        onFinish={handleGenerate}
        initialValues={{
          period: PERIODS[1],
          periodLabel: '',
          recipient: 'Ban Giám đốc Chi nhánh',
          unit: 'Phòng Tổ chức Tổng hợp - VietinBank Chi nhánh Bắc Nghệ An',
          author: '',
          extraNote: '',
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Form.Item name="period" label={t('modals.report.period')}>
            <Select options={PERIODS.map((p) => ({ value: p, label: p }))} />
          </Form.Item>

          <Form.Item name="periodLabel" label={t('modals.report.periodLabel')}>
            <Input placeholder={t('modals.report.periodPlaceholder')} />
          </Form.Item>

          <Form.Item name="recipient" label={t('modals.report.recipient')}>
            <Input />
          </Form.Item>

          <Form.Item name="unit" label={t('modals.report.unit')}>
            <Input />
          </Form.Item>

          <Form.Item name="author" label={t('modals.report.author')}>
            <Input placeholder={t('modals.report.authorPlaceholder')} />
          </Form.Item>

          <Form.Item name="extraNote" label={t('modals.report.extraNote')}>
            <Input placeholder={t('modals.report.extraNotePlaceholder')} />
          </Form.Item>
        </div>

        <Space wrap className="mb-4">
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            htmlType="submit"
            loading={isGenerating}
            disabled={payloadTasks.length === 0}
            size="large"
          >
            {isGenerating ? t('modals.report.generating') : t('modals.report.generate')}
          </Button>

          {report && (
            <>
              <Button icon={<CopyOutlined />} onClick={handleCopy} size="large">
                {copied ? t('modals.report.copied') : t('modals.report.copy')}
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleDownload} size="large">
                {t('modals.report.download')}
              </Button>
            </>
          )}
        </Space>
      </Form>

      {error && <Alert type="error" message={error} showIcon className="mb-4" />}

      {report && (
        <div>
          <label className="block text-xs font-semibold mb-1 text-[#00203F]">
            {t('modals.report.result')}
          </label>
          <TextArea
            value={report}
            onChange={(e) => setReport(e.target.value)}
            style={{ height: 420, fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 1.7 }}
          />
          <p className="text-[11px] text-[#5C6B7F] mt-1">{t('modals.report.reviewHint')}</p>
        </div>
      )}
    </Modal>
  );
}
