import type { Task, TaskStatus } from '@/types';
import { STATUS_IDS } from '@/constants';

/** Một dòng dữ liệu thô lấy từ bảng tasks */
export interface TaskRow {
  id: number | string;
  quadrant: string;
  content: string;
  department: string | null;
  assignee: string | null;
  category: string | null;
  note: string | null;
  due_date: string | Date | null;
  status: string;
}

/** Đưa ngày về dạng YYYY-MM-DD */
export function toDateString(value: string | Date | null): string {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export function normalizeStatus(value: unknown): TaskStatus {
  return STATUS_IDS.includes(value as TaskStatus)
    ? (value as TaskStatus)
    : 'chua-bat-dau';
}

/** Chuyển một dòng cơ sở dữ liệu thành đối tượng dùng ở giao diện */
export function rowToTask(row: TaskRow): Task {
  const status = normalizeStatus(row.status);
  return {
    id: Number(row.id),
    text: row.content,
    department: row.department ?? '',
    assignee: row.assignee ?? '',
    category: row.category ?? '',
    note: row.note ?? '',
    dueDate: toDateString(row.due_date),
    status,
    completed: status === 'hoan-thanh',
  };
}

/** Làm sạch dữ liệu người dùng gửi lên trước khi ghi vào cơ sở dữ liệu */
export function sanitizeInput(body: Record<string, unknown>) {
  const str = (value: unknown, max = 500) =>
    typeof value === 'string' ? value.trim().slice(0, max) : '';

  const dueDate = str(body.dueDate, 10);
  return {
    text: str(body.text, 1000),
    department: str(body.department, 200),
    assignee: str(body.assignee, 200),
    category: str(body.category, 200),
    note: str(body.note, 2000),
    dueDate: /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? dueDate : null,
    status: normalizeStatus(body.status),
  };
}
