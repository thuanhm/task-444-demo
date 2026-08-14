import { NextResponse } from 'next/server';
import { checkAccess } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** POST /api/session - kiểm tra mã truy cập khi đăng nhập */
export async function POST(request: Request) {
  const denied = checkAccess(request);
  if (denied) return denied;

  return NextResponse.json({ ok: true });
}
