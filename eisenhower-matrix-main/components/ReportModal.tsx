'use client';

import { useMemo, useState } from 'react';
import { useCommonTranslation } from '@/hooks/useTranslation';
import { useAccess } from '@/components/AccessGate';
import { apiFetch } from '@/lib/apiClient';
import { flattenBoard, daysLeft } from '@/lib/taskUtils';
import type { ReportOptions } from '@/lib/reportPrompt';
import type { TasksByQuadrant } from '@/types';

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

  const [options, setOptions] = useState<ReportOptions>({
    period: PERIODS[1],
    periodLabel: '',
    recipient: 'Ban Giám đốc Chi nhánh',
    unit: 'Phòng Tổ chức Tổng hợp - VietinBank Chi nhánh Bắc Nghệ An',
    author: '',
    extraNote: '',
  });
  const [report, setReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const payloadTasks = useMemo(
    () =>
      flattenBoard(tasks).map((task) => ({
        ...task,
        daysLeft: daysLeft(task.dueDate),
      })),
    [tasks],
  );

  if (!isOpen) return null;

  const set = (patch: Partial<ReportOptions>) =>
    setOptions((prev) => ({ ...prev, ...patch }));

  const handleGenerate = async () => {
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

  /** Tải về dạng .doc để mở bằng Word, giữ nguyên xuống dòng */
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

  const inputClass =
    'w-full px-3 py-2 border-2 border-[#003B71] text-sm focus:outline-none focus:ring-2 focus:ring-[#0072BC]';
  const labelClass = 'block text-xs font-semibold mb-1 text-[#003B71]';

  return (
    <div className="fixed inset-0 bg-[#003B71]/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white border-2 border-[#003B71] max-w-4xl w-full my-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sticky top-0 bg-white border-b-2 border-[#003B71] z-10">
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-[#003B71]">
            🖋 {t('modals.report.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-[#003B71] hover:opacity-70 text-2xl font-bold"
            aria-label={t('actions.close')}
          >
            ×
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 space-y-4">
          <p className="text-xs text-[#7A8FA6]">
            {t('modals.report.scope')} <strong>{payloadTasks.length}</strong>{' '}
            {t('modals.report.scopeUnit')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('modals.report.period')}</label>
              <select
                className={inputClass}
                value={options.period}
                onChange={(e) => set({ period: e.target.value })}
              >
                {PERIODS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>{t('modals.report.periodLabel')}</label>
              <input
                className={inputClass}
                placeholder={t('modals.report.periodPlaceholder')}
                value={options.periodLabel}
                onChange={(e) => set({ periodLabel: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>{t('modals.report.recipient')}</label>
              <input
                className={inputClass}
                value={options.recipient}
                onChange={(e) => set({ recipient: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>{t('modals.report.unit')}</label>
              <input
                className={inputClass}
                value={options.unit}
                onChange={(e) => set({ unit: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>{t('modals.report.author')}</label>
              <input
                className={inputClass}
                placeholder={t('modals.report.authorPlaceholder')}
                value={options.author}
                onChange={(e) => set({ author: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>{t('modals.report.extraNote')}</label>
              <input
                className={inputClass}
                placeholder={t('modals.report.extraNotePlaceholder')}
                value={options.extraNote}
                onChange={(e) => set({ extraNote: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || payloadTasks.length === 0}
              className="btn-blue px-6 py-2.5 font-bold text-sm uppercase disabled:opacity-60"
            >
              {isGenerating ? t('modals.report.generating') : t('modals.report.generate')}
            </button>

            {report && (
              <>
                <button onClick={handleCopy} className="btn-white px-5 py-2.5 font-bold text-sm uppercase">
                  {copied ? t('modals.report.copied') : t('modals.report.copy')}
                </button>
                <button onClick={handleDownload} className="btn-white px-5 py-2.5 font-bold text-sm uppercase">
                  {t('modals.report.download')}
                </button>
              </>
            )}
          </div>

          {error && (
            <p className="text-sm font-semibold text-[#E31837] border-2 border-[#E31837] bg-[#FDE7EA] px-3 py-2">
              {error}
            </p>
          )}

          {report && (
            <div>
              <label className={labelClass}>{t('modals.report.result')}</label>
              <textarea
                className="w-full border-2 border-[#003B71] p-4 text-sm leading-relaxed font-serif h-[420px] focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
                value={report}
                onChange={(e) => setReport(e.target.value)}
              />
              <p className="text-[11px] text-[#7A8FA6] mt-1">
                {t('modals.report.reviewHint')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
