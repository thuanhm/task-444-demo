import { NextResponse } from 'next/server';

export const ACCESS_HEADER = 'x-app-key';

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

  if (!provided || provided !== expected) {
    return NextResponse.json(
      { error: 'Mã truy cập không đúng.' },
      { status: 401 },
    );
  }

  return null;
}
