export type QuadrantType =
  | 'urgent-important'
  | 'not-urgent-important'
  | 'urgent-not-important'
  | 'not-urgent-not-important';

/** Trạng thái thực hiện công việc */
export type TaskStatus = 'chua-bat-dau' | 'dang-lam' | 'hoan-thanh';

export interface Task {
  id: number;
  text: string;
  /** Phòng/bộ phận được giao chủ trì */
  department: string;
  /** Cán bộ đầu mối thực hiện */
  assignee: string;
  /** Hạn chót, dạng YYYY-MM-DD; rỗng nghĩa là chưa ấn định */
  dueDate: string;
  /** Loại công việc: Báo cáo, Hồ sơ, Khách hàng... */
  category: string;
  status: TaskStatus;
  /** Ghi chú tiến độ, kết quả xử lý */
  note: string;
  completed: boolean;
}

/** Dữ liệu dùng khi thêm mới hoặc cập nhật một công việc */
export interface TaskInput {
  text: string;
  department: string;
  assignee: string;
  dueDate: string;
  category: string;
  status: TaskStatus;
  note: string;
}

export interface TasksByQuadrant {
  'urgent-important': Task[];
  'not-urgent-important': Task[];
  'urgent-not-important': Task[];
  'not-urgent-not-important': Task[];
}

export interface QuadrantConfig {
  id: QuadrantType;
  title: string;
  subtitle: string;
  color: string;
}

/** Bộ lọc trên thanh công cụ */
export interface TaskFilters {
  keyword: string;
  department: string;
  assignee: string;
  category: string;
  status: TaskStatus | 'all';
  dueFrom: string;
  dueTo: string;
  /** Chỉ hiện việc quá hạn hoặc sắp đến hạn */
  onlyAtRisk: boolean;
}

/** Ngưỡng cảnh báo hạn chót (số ngày còn lại) */
export interface DeadlineThresholds {
  red: number;
  amber: number;
}

/** Mức độ cảnh báo của một công việc theo hạn chót */
export type DeadlineLevel = 'overdue' | 'red' | 'amber' | 'normal' | 'none';
