import type {
  QuadrantConfig,
  TaskStatus,
  TaskFilters,
  DeadlineThresholds,
} from '@/types';

/**
 * Bảng màu theo nhận diện thương hiệu VietinBank
 */
export const COLORS = {
  blue: '#0072BC',       // Xanh VietinBank (chủ đạo)
  navy: '#003B71',       // Xanh đậm - viền, chữ
  red: '#E31837',        // Đỏ VietinBank
  gold: '#F5A81C',       // Vàng đồng
  green: '#0E9F6E',      // Xanh lá - đã hoàn thành
  teal: '#00A0A8',
  slate: '#7A8FA6',      // Xám xanh
  background: '#EEF3F8',
  surface: '#FFFFFF',
  lightBlue: '#DCEBF8',
} as const;

/** Bốn nhóm công việc của Ma trận Eisenhower */
export const QUADRANTS: QuadrantConfig[] = [
  {
    id: 'urgent-important',
    title: 'LÀM NGAY',
    subtitle: 'Khẩn cấp & Quan trọng',
    color: COLORS.red,
  },
  {
    id: 'not-urgent-important',
    title: 'LÊN LỊCH',
    subtitle: 'Quan trọng nhưng không khẩn cấp',
    color: COLORS.blue,
  },
  {
    id: 'urgent-not-important',
    title: 'GIAO VIỆC',
    subtitle: 'Khẩn cấp nhưng không quan trọng',
    color: COLORS.gold,
  },
  {
    id: 'not-urgent-not-important',
    title: 'LOẠI BỎ',
    subtitle: 'Không khẩn cấp & Không quan trọng',
    color: COLORS.slate,
  },
];

/** Ba trạng thái thực hiện, kèm màu hiển thị */
export const STATUSES: { id: TaskStatus; color: string }[] = [
  { id: 'chua-bat-dau', color: COLORS.slate },
  { id: 'dang-lam', color: COLORS.blue },
  { id: 'hoan-thanh', color: COLORS.green },
];

export const STATUS_IDS = STATUSES.map((s) => s.id);

/** Ngưỡng cảnh báo mặc định: đỏ khi còn tối đa 1 ngày, vàng khi còn tối đa 4 ngày */
export const DEFAULT_THRESHOLDS: DeadlineThresholds = { red: 1, amber: 4 };

export const THRESHOLD_STORAGE_KEY = 'vtb-eisenhower-thresholds';

export const EMPTY_FILTERS: TaskFilters = {
  keyword: '',
  department: '',
  assignee: '',
  category: '',
  status: 'all',
  dueFrom: '',
  dueTo: '',
  onlyAtRisk: false,
};

/** Màu theo mức cảnh báo hạn chót */
export const DEADLINE_COLORS = {
  overdue: '#B00020',
  red: COLORS.red,
  amber: COLORS.gold,
  normal: COLORS.slate,
  none: '#B7C4D2',
} as const;
