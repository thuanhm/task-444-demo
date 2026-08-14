'use client';

import * as XLSX from 'xlsx';
import { QUADRANTS, STATUS_IDS } from '@/constants';
import { flattenBoard, formatDate } from '@/lib/taskUtils';
import type { QuadrantType, TaskInput, TasksByQuadrant, TaskStatus } from '@/types';

const QUADRANT_LABEL: Record<QuadrantType, string> = {
  'urgent-important': 'Quan trọng - Khẩn cấp',
  'not-urgent-important': 'Quan trọng - Không khẩn cấp',
  'urgent-not-important': 'Không quan trọng - Khẩn cấp',
  'not-urgent-not-important': 'Không quan trọng - Không khẩn cấp',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  'chua-bat-dau': 'Chưa bắt đầu',
  'dang-lam': 'Đang làm',
  'hoan-thanh': 'Hoàn thành',
};

/** Tên cột trong tệp Excel, dùng chung cho cả xuất và nhập */
const HEADERS = [
  'Nội dung',
  'Phòng phụ trách',
  'Người thực hiện',
  'Hạn chót',
  'Loại công việc',
  'Nhóm ưu tiên',
  'Trạng thái',
  'Ghi chú',
];

/** Xuất danh sách công việc (đang hiển thị sau khi lọc) ra tệp Excel */
export function exportToExcel(board: TasksByQuadrant, fileName?: string) {
  const rows = flattenBoard(board).map((task) => ({
    'Nội dung': task.text,
    'Phòng phụ trách': task.department,
    'Người thực hiện': task.assignee,
    'Hạn chót': formatDate(task.dueDate),
    'Loại công việc': task.category,
    'Nhóm ưu tiên': QUADRANT_LABEL[task.quadrant],
    'Trạng thái': STATUS_LABEL[task.status],
    'Ghi chú': task.note,
  }));

  const sheet = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
  sheet['!cols'] = [
    { wch: 48 }, { wch: 22 }, { wch: 20 }, { wch: 12 },
    { wch: 18 }, { wch: 30 }, { wch: 14 }, { wch: 40 },
  ];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Cong viec');

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  XLSX.writeFile(book, fileName ?? `Cong-viec-Eisenhower-${stamp}.xlsx`);
}

/** Tạo tệp Excel mẫu để cán bộ điền rồi nhập vào hệ thống */
export function downloadTemplate() {
  const sample = [
    {
      'Nội dung': 'Ví dụ: Báo cáo huy động vốn tháng 8 theo chỉ đạo của Ban giám đốc',
      'Phòng phụ trách': 'Phòng Khách hàng doanh nghiệp',
      'Người thực hiện': 'Nguyễn Văn A',
      'Hạn chót': '25/08/2026',
      'Loại công việc': 'Báo cáo',
      'Nhóm ưu tiên': QUADRANT_LABEL['urgent-important'],
      'Trạng thái': 'Chưa bắt đầu',
      'Ghi chú': '',
    },
  ];

  const sheet = XLSX.utils.json_to_sheet(sample, { header: HEADERS });
  sheet['!cols'] = [
    { wch: 48 }, { wch: 22 }, { wch: 20 }, { wch: 12 },
    { wch: 18 }, { wch: 30 }, { wch: 14 }, { wch: 40 },
  ];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Mau nhap');
  XLSX.writeFile(book, 'Mau-nhap-cong-viec.xlsx');
}

/** Chuyển chuỗi ngày dd/mm/yyyy hoặc yyyy-mm-dd (hoặc số ngày của Excel) sang yyyy-mm-dd */
function parseDate(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${parsed.y}-${pad(parsed.m)}-${pad(parsed.d)}`;
  }

  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);

  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
}

/** Đoán nhóm ưu tiên từ chữ trong tệp */
function parseQuadrant(value: unknown): QuadrantType {
  const text = String(value ?? '').toLowerCase();
  const direct = QUADRANTS.find((q) => q.id === text);
  if (direct) return direct.id;

  const important = text.includes('quan trọng') && !text.includes('không quan trọng');
  const urgent = text.includes('khẩn cấp') && !text.includes('không khẩn cấp');

  if (important && urgent) return 'urgent-important';
  if (important && !urgent) return 'not-urgent-important';
  if (!important && urgent) return 'urgent-not-important';
  return 'not-urgent-not-important';
}

function parseStatus(value: unknown): TaskStatus {
  const text = String(value ?? '').toLowerCase().trim();
  if (STATUS_IDS.includes(text as TaskStatus)) return text as TaskStatus;
  if (text.includes('hoàn thành') || text.includes('xong') && !text.includes('chưa xong'))
    return 'hoan-thanh';
  if (text.includes('đang')) return 'dang-lam';
  return 'chua-bat-dau';
}

/** Đọc tệp Excel/CSV người dùng chọn và chuyển thành danh sách công việc */
export async function readTasksFromFile(
  file: File,
): Promise<(TaskInput & { quadrant: QuadrantType })[]> {
  const buffer = await file.arrayBuffer();
  const book = XLSX.read(buffer, { type: 'array' });
  const sheet = book.Sheets[book.SheetNames[0]];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const pick = (row: Record<string, unknown>, ...names: string[]) => {
    for (const name of names) {
      const key = Object.keys(row).find(
        (k) => k.trim().toLowerCase() === name.toLowerCase(),
      );
      if (key !== undefined && row[key] !== '') return row[key];
    }
    return '';
  };

  return rows
    .map((row) => ({
      text: String(pick(row, 'Nội dung', 'Noi dung', 'Content') ?? '').trim(),
      department: String(pick(row, 'Phòng phụ trách', 'Phòng ban', 'Mã phòng ban') ?? '').trim(),
      assignee: String(pick(row, 'Người thực hiện', 'Nguoi thuc hien') ?? '').trim(),
      dueDate: parseDate(pick(row, 'Hạn chót', 'Han chot', 'Deadline')),
      category: String(pick(row, 'Loại công việc', 'Loai cong viec') ?? '').trim(),
      status: parseStatus(pick(row, 'Trạng thái', 'Trang thai')),
      note: String(pick(row, 'Ghi chú', 'Ghi chu') ?? '').trim(),
      quadrant: parseQuadrant(pick(row, 'Nhóm ưu tiên', 'Ma trận', 'Ma tran')),
    }))
    .filter((row) => row.text.length > 0);
}
