import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

export const ACCESS_HEADER = 'x-app-key';

/**
 * So sánh hai chuỗi mà không để lộ thông tin qua thời gian xử lý
 * (constant-time compare) — tránh kiểu tấn công đoán từng ký tự
 * dựa vào việc so sánh `!==` thường dừng sớm ngay khi gặp ký tự sai.
 */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Độ dài khác nhau là lộ thông tin, nhưng vẫn phải chạy so sánh đủ thời gian
  // với một buffer cùng cỡ để không làm ngắn thời gian phản hồi.
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Kiểm tra mã truy cập gửi kèm mỗi yêu cầu.
 * Trả về NextResponse lỗi nếu không hợp lệ, trả về null nếu hợp lệ.
 */
export function checkAccess(request: Request): NextResponse | null {
  const expected = process.env.APP_ACCESS_KEY;

  if (!expected) {
    return NextResponse.json(
      { error: 'Máy chủ chưa cấu hình APP_ACCESS_KEY.' },
      { status: 500 },
    );
  }

  const provided = request.headers.get(ACCESS_HEADER);

  if (!provided || !safeCompare(provided, expected)) {
    return NextResponse.json(
      { error: 'Mã truy cập không đúng.' },
      { status: 401 },
    );
  }

  return null;
}
