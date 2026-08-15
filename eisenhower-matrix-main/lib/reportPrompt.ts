import type { Task, TaskStatus, QuadrantType } from '@/types';

/** Tham số người dùng chọn khi tạo báo cáo */
export interface ReportOptions {
  /** Loại kỳ báo cáo: tuần, tháng, quý, đột xuất */
  period: string;
  /** Mốc thời gian của kỳ, ví dụ "tháng 8/2026" */
  periodLabel: string;
  /** Nơi nhận: Ban giám đốc chi nhánh, Lãnh đạo phòng... */
  recipient: string;
  /** Đơn vị lập báo cáo */
  unit: string;
  /** Người ký/lập báo cáo */
  author: string;
  /** Yêu cầu thêm của người dùng */
  extraNote: string;
}

export interface ReportTask extends Task {
  quadrant: QuadrantType;
  daysLeft: number | null;
}

const QUADRANT_LABEL: Record<QuadrantType, string> = {
  'urgent-important': 'Quan trọng - Khẩn cấp',
  'not-urgent-important': 'Quan trọng - Không khẩn cấp',
  'urgent-not-important': 'Không quan trọng - Khẩn cấp',
  'not-urgent-not-important': 'Không quan trọng - Không khẩn cấp',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  'chua-bat-dau': 'Chưa bắt đầu',
  'dang-lam': 'Đang thực hiện',
  'hoan-thanh': 'Đã hoàn thành',
};

/** Gom số liệu theo phòng để mô hình có sẵn con số, không phải tự cộng */
function summarizeByDepartment(tasks: ReportTask[]) {
  const map = new Map<string, { total: number; done: number; doing: number; notStarted: number; overdue: number }>();

  for (const task of tasks) {
    const key = task.department?.trim() || 'Chưa phân công';
    const row = map.get(key) ?? { total: 0, done: 0, doing: 0, notStarted: 0, overdue: 0 };
    row.total += 1;
    if (task.status === 'hoan-thanh') row.done += 1;
    else if (task.status === 'dang-lam') row.doing += 1;
    else row.notStarted += 1;
    if (task.status !== 'hoan-thanh' && task.daysLeft !== null && task.daysLeft < 0) {
      row.overdue += 1;
    }
    map.set(key, row);
  }

  return Array.from(map.entries())
    .map(([department, row]) => ({ department, ...row }))
    .sort((a, b) => b.total - a.total);
}

/** Dựng phần dữ liệu đưa vào lời nhắc, dạng bảng gọn để mô hình đọc chính xác */
function buildDataSection(tasks: ReportTask[]): string {
  const byDepartment = summarizeByDepartment(tasks);

  const summaryLines = byDepartment.map(
    (row) =>
      `- ${row.department}: tổng ${row.total}; hoàn thành ${row.done}; đang thực hiện ${row.doing}; ` +
      `chưa bắt đầu ${row.notStarted}; quá hạn ${row.overdue}`,
  );

  const detailLines = tasks.map((task, index) => {
    const parts = [
      `${index + 1}. ${task.text}`,
      `phòng phụ trách: ${task.department || 'chưa phân công'}`,
      `người thực hiện: ${task.assignee || 'chưa phân công'}`,
      `nhóm ưu tiên: ${QUADRANT_LABEL[task.quadrant]}`,
      `trạng thái: ${STATUS_LABEL[task.status]}`,
    ];
    if (task.dueDate) {
      const [y, m, d] = task.dueDate.split('-');
      parts.push(`hạn chót: ${d}/${m}/${y}`);
      if (task.status !== 'hoan-thanh' && task.daysLeft !== null) {
        parts.push(
          task.daysLeft < 0
            ? `ĐÃ QUÁ HẠN ${Math.abs(task.daysLeft)} ngày`
            : `còn ${task.daysLeft} ngày`,
        );
      }
    }
    if (task.category) parts.push(`loại việc: ${task.category}`);
    if (task.note) parts.push(`ghi chú: ${task.note}`);
    return parts.join(' | ');
  });

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'hoan-thanh').length;
  const overdue = tasks.filter(
    (t) => t.status !== 'hoan-thanh' && t.daysLeft !== null && t.daysLeft < 0,
  ).length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;

  return [
    `TỔNG HỢP CHUNG: tổng số nhiệm vụ ${total}; đã hoàn thành ${done} (${rate}%); quá hạn ${overdue}.`,
    '',
    'SỐ LIỆU THEO PHÒNG:',
    ...summaryLines,
    '',
    'DANH SÁCH CHI TIẾT:',
    ...detailLines,
  ].join('\n');
}

/** Lời nhắc gửi cho Gemini: quy định văn phong hành chính và bố cục báo cáo */
export function buildReportPrompt(tasks: ReportTask[], options: ReportOptions): string {
  return `Bạn là chuyên viên Phòng Tổ chức Tổng hợp của một chi nhánh ngân hàng thương mại cổ phần Công Thương Việt Nam.
Hãy soạn một BÁO CÁO bằng tiếng Việt, đúng văn phong hành chính công vụ trong ngành ngân hàng,
về tình hình thực hiện các nhiệm vụ được giao.

THÔNG TIN BÁO CÁO
- Đơn vị lập báo cáo: ${options.unit}
- Nơi nhận: ${options.recipient}
- Loại báo cáo: ${options.period}
- Kỳ báo cáo: ${options.periodLabel}
- Người lập: ${options.author || '(để trống)'}
${options.extraNote ? `- Yêu cầu thêm của người lập: ${options.extraNote}` : ''}

DỮ LIỆU THỰC TẾ (chỉ được dùng đúng dữ liệu này)
${buildDataSection(tasks)}

YÊU CẦU VỀ HÌNH THỨC VÀ NỘI DUNG
1. Bố cục theo mẫu văn bản hành chính:
   - Phần đầu: tên đơn vị, "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM / Độc lập - Tự do - Hạnh phúc",
     số hiệu để trống dạng "Số:      /BC-...", dòng địa danh và ngày tháng để trống dạng "..., ngày ... tháng ... năm ...".
   - Tiêu đề: "BÁO CÁO" và dòng trích yếu nội dung.
   - Kính gửi: ${options.recipient}.
2. Thân báo cáo chia mục theo số La Mã:
   I. TÌNH HÌNH CHUNG (nêu tổng số nhiệm vụ, tỷ lệ hoàn thành, số quá hạn)
   II. KẾT QUẢ THỰC HIỆN THEO TỪNG PHÒNG (nêu số liệu từng phòng, nhận xét ngắn gọn)
   III. NHIỆM VỤ QUÁ HẠN, CHẬM TIẾN ĐỘ (nêu rõ tên nhiệm vụ, phòng phụ trách, số ngày quá hạn)
   IV. ĐÁNH GIÁ CHUNG (ưu điểm, tồn tại)
   V. ĐỀ XUẤT, KIẾN NGHỊ
3. Cuối văn bản có phần "Nơi nhận:" và chỗ ký của người lập/lãnh đạo đơn vị.
4. Văn phong trang trọng, khách quan, câu ngắn gọn, dùng thuật ngữ hành chính - ngân hàng
   ("triển khai", "đôn đốc", "bám sát chỉ đạo", "báo cáo Ban giám đốc xem xét, chỉ đạo").
5. Chỉ nêu số liệu có trong dữ liệu trên. Tuyệt đối không bịa thêm nhiệm vụ, con số,
   tên người hay đơn vị nào khác. Nếu một mục không có dữ liệu thì ghi rõ là không phát sinh.
6. Trả về văn bản thuần (plain text), không dùng ký hiệu markdown như **, ##, hay bảng markdown.`;
}
