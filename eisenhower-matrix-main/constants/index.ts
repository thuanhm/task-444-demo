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
  navyDark: '#00203F',   // Xanh rất đậm - header, nhấn mạnh
  navy: '#004A8F',       // Xanh VietinBank (chủ đạo)
  blue: '#004A8F',       // Bí danh giữ tương thích ngược
  navyLight: '#1568B8',  // Xanh sáng - hover, liên kết
  red: '#EE1C25',        // Đỏ VietinBank
  gold: '#D8A13B',       // Vàng đồng
  green: '#1E8E5A',      // Xanh lá - đã hoàn thành / tốt
  warn: '#C6801E',       // Cam vàng - cảnh báo
  bad: '#D23B3B',        // Đỏ - lỗi / quá hạn
  slate: '#5C6B7F',      // Xám xanh - chữ phụ
  ink: '#122238',        // Màu chữ chính
  background: '#EEF2F7',
  surface: '#FFFFFF',
  line: '#DCE3EC',       // Màu viền nhạt
  lightBlue: '#EEF2F7',
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
  overdue: COLORS.bad,
  red: COLORS.red,
  amber: COLORS.warn,
  normal: COLORS.slate,
  none: COLORS.line,
} as const;
