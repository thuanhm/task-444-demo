'use client';

import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

/** Mã kỳ báo cáo dùng nội bộ, tách khỏi nhãn hiển thị */
export type PeriodKey = 'week' | 'month' | 'quarter' | 'adhoc';

export interface PeriodRange {
  /** Ngày bắt đầu kỳ, rỗng nếu là báo cáo đột xuất */
  from: string;
  /** Ngày kết thúc kỳ, rỗng nếu là báo cáo đột xuất */
  to: string;
  /** Nhãn kỳ báo cáo để ghi vào văn bản, VD "tháng 8/2026" */
  label: string;
}

/**
 * Tính khoảng ngày và nhãn của kỳ báo cáo, lấy mốc là ngày hiện tại.
 * - Tuần: thứ Hai đến Chủ nhật của tuần này (chuẩn ISO)
 * - Tháng: ngày đầu đến ngày cuối tháng này
 * - Quý: ngày đầu đến ngày cuối quý này
 * - Đột xuất: không giới hạn khoảng ngày
 */
export function computePeriodRange(period: PeriodKey, base: Dayjs = dayjs()): PeriodRange {
  const fmt = (value: Dayjs) => value.format('YYYY-MM-DD');

  switch (period) {
    case 'week': {
      const start = base.startOf('isoWeek');
      const end = base.endOf('isoWeek');
      return {
        from: fmt(start),
        to: fmt(end),
        label: `tuần từ ngày ${start.format('DD/MM/YYYY')} đến ngày ${end.format('DD/MM/YYYY')}`,
      };
    }
    case 'month': {
      const start = base.startOf('month');
      const end = base.endOf('month');
      return {
        from: fmt(start),
        to: fmt(end),
        label: `tháng ${start.format('M/YYYY')}`,
      };
    }
    case 'quarter': {
      const start = base.startOf('quarter');
      const end = base.endOf('quarter');
      return {
        from: fmt(start),
        to: fmt(end),
        label: `quý ${start.quarter()}/${start.format('YYYY')}`,
      };
    }
    default:
      return { from: '', to: '', label: '' };
  }
}

/** Nhãn hiển thị của từng loại kỳ, dùng cho ô chọn và ghi vào văn bản */
export const PERIOD_LABELS: Record<PeriodKey, string> = {
  week: 'Báo cáo tuần',
  month: 'Báo cáo tháng',
  quarter: 'Báo cáo quý',
  adhoc: 'Báo cáo đột xuất',
};

/** Tự sinh nhãn kỳ khi người dùng tự chỉnh khoảng ngày */
export function labelFromRange(from: string, to: string): string {
  if (!from || !to) return '';
  return `từ ngày ${dayjs(from).format('DD/MM/YYYY')} đến ngày ${dayjs(to).format('DD/MM/YYYY')}`;
}
