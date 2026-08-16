import { NextResponse } from 'next/server';

/**
 * Giới hạn tần suất gọi API kiểu "cửa sổ cố định" (fixed window), lưu bộ đếm
 * trong bộ nhớ của tiến trình — không cần thêm dịch vụ ngoài (Redis...).
 *
 * Giới hạn thật: mỗi tiến trình serverless (Vercel) có bộ đếm riêng, và có
 * thể bị nhiều tiến trình chạy song song nên đây không phải giới hạn tuyệt
 * đối chính xác 100% — nhưng đủ để chặn việc gọi dồn dập/lỗi vòng lặp làm
 * cạn hạn mức Gemini hay dội dữ liệu vào Neon. Nếu sau này cần giới hạn
 * chính xác qua nhiều tiến trình, chuyển sang Upstash Redis (@upstash/ratelimit).
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

// Dọn bớt bộ nhớ định kỳ để không phình to khi chạy lâu
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

/** Lấy định danh người gọi: ưu tiên IP thật phía sau proxy của Vercel */
function getClientId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

interface RateLimitOptions {
  /** Tên route, để tách bộ đếm giữa các API khác nhau */
  scope: string;
  /** Số lượt tối đa trong một cửa sổ thời gian */
  limit: number;
  /** Độ dài cửa sổ, tính bằng mili-giây */
  windowMs: number;
}

/**
 * Kiểm tra và ghi nhận một lượt gọi. Trả về NextResponse lỗi 429 nếu vượt
 * giới hạn, trả về null nếu còn được phép gọi.
 */
export function checkRateLimit(request: Request, options: RateLimitOptions): NextResponse | null {
  cleanup();

  const id = getClientId(request);
  const key = `${options.scope}:${id}`;
  const now = Date.now();

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  if (bucket.count >= options.limit) {
    const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      {
        error: `Bạn đang thao tác quá nhanh. Vui lòng thử lại sau khoảng ${retryAfterSec} giây.`,
      },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
    );
  }

  bucket.count += 1;
  return null;
}
