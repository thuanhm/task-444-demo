'use client';

import { useMemo, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  Alert,
  Typography,
  DatePicker,
  Checkbox,
} from 'antd';
import { FileTextOutlined, CopyOutlined, DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useCommonTranslation } from '@/hooks/useTranslation';
import { useAccess } from '@/components/AccessGate';
import { apiFetch } from '@/lib/apiClient';
import { flattenBoard, daysLeft } from '@/lib/taskUtils';
import { exportReportToDocx } from '@/lib/exportDocx';
import {
  computePeriodRange,
  labelFromRange,
  PERIOD_LABELS,
  type PeriodKey,
} from '@/lib/periodRange';
import type { ReportOptions } from '@/lib/reportPrompt';
import type { TasksByQuadrant } from '@/types';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface ReportModalProps {
  isOpen: boolean;
  tasks: TasksByQuadrant;
  onClose: () => void;
  /** Áp khoảng ngày của kỳ báo cáo vào bộ lọc màn hình chính */
  onApplyDateFilter?: (from: string, to: string) => void;
}

/** Hộp thoại tạo báo cáo hành chính bằng AI từ dữ liệu đang hiển thị */
export function ReportModal({ isOpen, tasks, onClose, onApplyDateFilter }: ReportModalProps) {
  const { t } = useCommonTranslation();
  const { accessKey } = useAccess();
  const [form] = Form.useForm<ReportOptions>();

  // Mặc định là báo cáo tháng, khoảng ngày tự tính theo tháng hiện tại
  const [periodKey, setPeriodKey] = useState<PeriodKey>('month');
  const initialRange = useMemo(() => computePeriodRange('month'), []);
  const [range, setRange] = useState<{ from: string; to: string }>({
    from: initialRange.from,
    to: initialRange.to,
  });
  const [limitByRange, setLimitByRange] = useState(true);

  const [report, setReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [filterApplied, setFilterApplied] = useState(false);

  const allTasks = useMemo(
    () => flattenBoard(tasks).map((task) => ({ ...task, daysLeft: daysLeft(task.dueDate) })),
    [tasks],
  );

  // Chỉ giữ nhiệm vụ có hạn chót nằm trong kỳ báo cáo
  const payloadTasks = useMemo(() => {
    if (!limitByRange || !range.from || !range.to) return allTasks;
    return allTasks.filter(
      (task) => task.dueDate && task.dueDate >= range.from && task.dueDate <= range.to,
    );
  }, [allTasks, limitByRange, range]);

  // Số nhiệm vụ chưa đặt hạn chót sẽ bị loại khỏi phạm vi khi lọc theo kỳ
  const undatedCount = useMemo(
    () => (limitByRange ? allTasks.filter((task) => !task.dueDate).length : 0),
    [allTasks, limitByRange],
  );

  if (!isOpen) return null;

  /** Đổi loại kỳ: tự tính lại khoảng ngày và nhãn kỳ */
  const handlePeriodChange = (value: PeriodKey) => {
    setPeriodKey(value);
    setFilterApplied(false);

    const next = computePeriodRange(value);
    setRange({ from: next.from, to: next.to });
    setLimitByRange(value !== 'adhoc');
    form.setFieldsValue({ period: PERIOD_LABELS[value], periodLabel: next.label });
  };

  /** Người dùng tự chỉnh khoảng ngày: cập nhật nhãn kỳ theo khoảng đã chọn */
  const handleRangeChange = (values: [Dayjs | null, Dayjs | null] | null) => {
    const from = values?.[0] ? values[0].format('YYYY-MM-DD') : '';
    const to = values?.[1] ? values[1].format('YYYY-MM-DD') : '';
    setRange({ from, to });
    setFilterApplied(false);
    if (from && to) {
      form.setFieldsValue({ periodLabel: labelFromRange(from, to) });
    }
  };

  const handleApplyFilter = () => {
    if (!onApplyDateFilter || !range.from || !range.to) return;
    onApplyDateFilter(range.from, range.to);
    setFilterApplied(true);
  };

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

  /** Xuất file .docx thật (chuẩn OOXML), mở trực tiếp bằng Word không cảnh báo */
  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      await exportReportToDocx(report, `Bao-cao-nhiem-vu-${stamp}.docx`);
    } catch {
      setError(t('modals.report.exportFailed'));
    } finally {
      setIsExporting(false);
    }
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
      <Form<ReportOptions>
        form={form}
        layout="vertical"
        onFinish={handleGenerate}
        initialValues={{
          period: PERIOD_LABELS.month,
          periodLabel: initialRange.label,
          recipient: 'Ban Giám đốc Chi nhánh',
          unit: 'Phòng Tổ chức Tổng hợp - VietinBank Chi nhánh Bắc Nghệ An',
          author: '',
          extraNote: '',
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Form.Item name="period" label={t('modals.report.period')}>
            <Select
              value={PERIOD_LABELS[periodKey]}
              onChange={(_, option) => handlePeriodChange((option as { key: PeriodKey }).key)}
              options={(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((key) => ({
                key,
                value: PERIOD_LABELS[key],
                label: PERIOD_LABELS[key],
              }))}
            />
          </Form.Item>

          <Form.Item name="periodLabel" label={t('modals.report.periodLabel')}>
            <Input placeholder={t('modals.report.periodPlaceholder')} />
          </Form.Item>
        </div>

        {/* Khoảng ngày của kỳ báo cáo, tự tính khi chọn loại kỳ */}
        <Form.Item label={t('modals.report.rangeLabel')} className="!mb-2">
          <RangePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            value={
              range.from && range.to ? [dayjs(range.from), dayjs(range.to)] : null
            }
            onChange={(values) =>
              handleRangeChange(values as [Dayjs | null, Dayjs | null] | null)
            }
            disabled={!limitByRange}
          />
        </Form.Item>

        <Space wrap className="mb-3" size={12}>
          <Checkbox
            checked={limitByRange}
            onChange={(e) => {
              setLimitByRange(e.target.checked);
              setFilterApplied(false);
            }}
          >
            <span className="text-xs sm:text-sm">{t('modals.report.limitByRange')}</span>
          </Checkbox>

          {onApplyDateFilter && limitByRange && range.from && range.to && (
            <Button
              size="small"
              icon={<FilterOutlined />}
              onClick={handleApplyFilter}
              type={filterApplied ? 'default' : 'dashed'}
            >
              {filterApplied
                ? t('modals.report.filterApplied')
                : t('modals.report.applyFilter')}
            </Button>
          )}
        </Space>

        <Alert
          type={payloadTasks.length === 0 ? 'warning' : 'info'}
          showIcon
          className="mb-4"
          message={
            <span className="text-xs sm:text-sm">
              {t('modals.report.scope')} <strong>{payloadTasks.length}</strong>{' '}
              {t('modals.report.scopeUnit')}
              {undatedCount > 0 && (
                <>
                  {' '}
                  <span className="text-[#5C6B7F]">
                    ({undatedCount} {t('modals.report.undatedExcluded')})
                  </span>
                </>
              )}
            </span>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
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
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                loading={isExporting}
                size="large"
              >
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
