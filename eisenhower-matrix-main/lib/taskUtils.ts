import type {
  DeadlineLevel,
  DeadlineThresholds,
  Task,
  TaskFilters,
  TasksByQuadrant,
  QuadrantType,
} from '@/types';

/** Ngày hôm nay theo múi giờ máy người dùng, cắt về 00:00 */
function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Số ngày còn lại tới hạn chót; âm là đã quá hạn, null là chưa đặt hạn */
export function daysLeft(dueDate: string): number | null {
  if (!dueDate) return null;
  const parts = dueDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const due = new Date(parts[0], parts[1] - 1, parts[2]);
  return Math.round((due.getTime() - today().getTime()) / 86400000);
}

/** Xếp mức cảnh báo của một công việc theo hạn chót và ngưỡng đã đặt */
export function deadlineLevel(
  task: Task,
  thresholds: DeadlineThresholds,
): DeadlineLevel {
  if (task.status === 'hoan-thanh') return 'none';
  const left = daysLeft(task.dueDate);
  if (left === null) return 'none';
  if (left < 0) return 'overdue';
  if (left <= thresholds.red) return 'red';
  if (left <= thresholds.amber) return 'amber';
  return 'normal';
}

export const isAtRisk = (level: DeadlineLevel) =>
  level === 'overdue' || level === 'red' || level === 'amber';

/** Hiển thị ngày dạng dd/mm/yyyy */
export function formatDate(dueDate: string): string {
  if (!dueDate) return '';
  const [y, m, d] = dueDate.split('-');
  return y && m && d ? `${d}/${m}/${y}` : dueDate;
}

/** Hiển thị ngày rút gọn dd/mm (không kèm năm) — dùng cho badge nhỏ trên thẻ công việc */
export function formatDateShort(dueDate: string): string {
  if (!dueDate) return '';
  const [, m, d] = dueDate.split('-');
  return m && d ? `${d}/${m}` : dueDate;
}

/** Một công việc có thỏa bộ lọc hay không */
export function matchesFilters(
  task: Task,
  filters: TaskFilters,
  thresholds: DeadlineThresholds,
): boolean {
  const keyword = filters.keyword.trim().toLowerCase();
  if (keyword) {
    const haystack = [task.text, task.department, task.assignee, task.category, task.note]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(keyword)) return false;
  }

  if (filters.department && task.department !== filters.department) return false;
  if (filters.assignee && task.assignee !== filters.assignee) return false;
  if (filters.category && task.category !== filters.category) return false;
  if (filters.status !== 'all' && task.status !== filters.status) return false;

  if (filters.dueFrom && (!task.dueDate || task.dueDate < filters.dueFrom)) return false;
  if (filters.dueTo && (!task.dueDate || task.dueDate > filters.dueTo)) return false;

  if (filters.onlyAtRisk && !isAtRisk(deadlineLevel(task, thresholds))) return false;

  return true;
}

/** Lọc toàn bộ bảng theo bộ lọc hiện hành */
export function filterBoard(
  board: TasksByQuadrant,
  filters: TaskFilters,
  thresholds: DeadlineThresholds,
): TasksByQuadrant {
  const result = {} as TasksByQuadrant;
  (Object.keys(board) as QuadrantType[]).forEach((quadrant) => {
    result[quadrant] = board[quadrant].filter((task) =>
      matchesFilters(task, filters, thresholds),
    );
  });
  return result;
}

/** Gộp toàn bộ công việc thành một danh sách phẳng, kèm nhóm của nó */
export function flattenBoard(board: TasksByQuadrant): (Task & { quadrant: QuadrantType })[] {
  return (Object.keys(board) as QuadrantType[]).flatMap((quadrant) =>
    board[quadrant].map((task) => ({ ...task, quadrant })),
  );
}

/** Danh sách giá trị duy nhất của một trường, dùng cho ô gợi ý và bộ lọc */
export function uniqueValues(
  board: TasksByQuadrant,
  field: 'department' | 'assignee' | 'category',
): string[] {
  const set = new Set<string>();
  flattenBoard(board).forEach((task) => {
    const value = task[field]?.trim();
    if (value) set.add(value);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
}

/** Thống kê nhanh hiển thị trên đầu trang */
export function summarize(board: TasksByQuadrant, thresholds: DeadlineThresholds) {
  const all = flattenBoard(board);
  return {
    total: all.length,
    notStarted: all.filter((t) => t.status === 'chua-bat-dau').length,
    inProgress: all.filter((t) => t.status === 'dang-lam').length,
    done: all.filter((t) => t.status === 'hoan-thanh').length,
    overdue: all.filter((t) => deadlineLevel(t, thresholds) === 'overdue').length,
    dueSoon: all.filter((t) => {
      const level = deadlineLevel(t, thresholds);
      return level === 'red' || level === 'amber';
    }).length,
  };
}

/** Danh sách việc cần cảnh báo, sắp xếp theo hạn chót gần nhất */
export function atRiskTasks(
  board: TasksByQuadrant,
  thresholds: DeadlineThresholds,
): (Task & { quadrant: QuadrantType; level: DeadlineLevel; left: number })[] {
  return flattenBoard(board)
    .map((task) => ({
      ...task,
      level: deadlineLevel(task, thresholds),
      left: daysLeft(task.dueDate) ?? 0,
    }))
    .filter((task) => isAtRisk(task.level))
    .sort((a, b) => a.left - b.left);
}

/** Thống kê theo phòng phụ trách - phục vụ theo dõi việc Ban giám đốc giao */
export function statsByDepartment(
  board: TasksByQuadrant,
  thresholds: DeadlineThresholds,
) {
  const map = new Map<
    string,
    { department: string; total: number; done: number; inProgress: number; overdue: number }
  >();

  flattenBoard(board).forEach((task) => {
    const key = task.department?.trim() || '(Chưa phân công)';
    const row =
      map.get(key) ?? { department: key, total: 0, done: 0, inProgress: 0, overdue: 0 };
    row.total += 1;
    if (task.status === 'hoan-thanh') row.done += 1;
    if (task.status === 'dang-lam') row.inProgress += 1;
    if (deadlineLevel(task, thresholds) === 'overdue') row.overdue += 1;
    map.set(key, row);
  });

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}
