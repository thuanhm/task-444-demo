import { NextResponse } from 'next/server';
import { checkAccess } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/** POST /api/session - kiểm tra mã truy cập khi đăng nhập */
export async function POST(request: Request) {
  // Giới hạn số lần thử mã truy cập để hạn chế dò mã tự động
  const limited = checkRateLimit(request, { scope: 'session', limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const denied = checkAccess(request);
  if (denied) return denied;

  return NextResponse.json({ ok: true });
}
