import { NextResponse } from 'next/server';
import { checkAccess } from '@/lib/auth';
import { buildReportPrompt, type ReportOptions, type ReportTask } from '@/lib/reportPrompt';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DEFAULT_MODEL = 'gemini-2.0-flash';

/** Mã lỗi HTTP nên tự thử lại: 503 (quá tải), 429 (vượt hạn mức/phút) */
const RETRYABLE_STATUS = new Set([503, 429]);
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1200;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Gọi Gemini, tự thử lại kèm chờ tăng dần khi mô hình báo quá tải */
async function callGemini(model: string, apiKey: string, prompt: string) {
  let lastStatus = 0;
  let lastDetail = '';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
        }),
      },
    );

    if (response.ok) return { ok: true as const, response };

    lastStatus = response.status;
    lastDetail = await response.text();

    if (!RETRYABLE_STATUS.has(response.status) || attempt === MAX_ATTEMPTS) {
      return { ok: false as const, status: lastStatus, detail: lastDetail, attempts: attempt };
    }

    // Quá tải/vượt hạn mức: chờ tăng dần rồi thử lại (1.2s, 2.4s...)
    await sleep(BASE_DELAY_MS * attempt);
  }

  return { ok: false as const, status: lastStatus, detail: lastDetail, attempts: MAX_ATTEMPTS };
}

/**
 * POST /api/report
 * Sinh báo cáo hành chính từ danh sách nhiệm vụ, dùng Google Gemini Flash.
 * Khóa API chỉ nằm ở máy chủ, không lộ ra trình duyệt.
 */
export async function POST(request: Request) {
  const denied = checkAccess(request);
  if (denied) return denied;

  // Tạo báo cáo tốn hạn mức Gemini nên giới hạn chặt hơn các API khác
  const limited = checkRateLimit(request, { scope: 'report', limit: 5, windowMs: 5 * 60_000 });
  if (limited) return limited;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Máy chủ chưa cấu hình GEMINI_API_KEY nên chưa tạo được báo cáo.' },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const tasks = (Array.isArray(body?.tasks) ? body.tasks : []) as ReportTask[];
    const options = (body?.options ?? {}) as ReportOptions;

    if (tasks.length === 0) {
      return NextResponse.json(
        { error: 'Không có nhiệm vụ nào trong phạm vi đang lọc để đưa vào báo cáo.' },
        { status: 400 },
      );
    }

    // Giới hạn khối lượng gửi đi để tránh vượt giới hạn của mô hình
    const limited = tasks.slice(0, 400);
    const prompt = buildReportPrompt(limited, options);
    const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;

    const result = await callGemini(model, apiKey, prompt);

    if (!result.ok) {
      console.error(
        `Gemini trả về lỗi sau ${result.attempts} lần thử:`,
        result.status,
        result.detail.slice(0, 500),
      );

      if (result.status === 503 || result.status === 429) {
        return NextResponse.json(
          {
            error:
              'Máy chủ Gemini đang quá tải tạm thời (đã tự thử lại nhưng vẫn chưa được). ' +
              'Đây là sự cố từ phía Google, không phải lỗi của hệ thống — vui lòng đợi khoảng 1-2 phút rồi bấm "Tạo báo cáo" lại.',
          },
          { status: 503 },
        );
      }

      if (result.status === 401 || result.status === 403) {
        return NextResponse.json(
          { error: 'Khóa GEMINI_API_KEY không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại cấu hình.' },
          { status: 502 },
        );
      }

      if (result.status === 404) {
        return NextResponse.json(
          { error: `Không tìm thấy mô hình "${model}". Kiểm tra lại biến GEMINI_MODEL.` },
          { status: 502 },
        );
      }

      return NextResponse.json(
        { error: `Dịch vụ tạo báo cáo báo lỗi (mã ${result.status}). Vui lòng thử lại sau.` },
        { status: 502 },
      );
    }

    const data = await result.response.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .map((part: { text?: string }) => part?.text ?? '')
      .join('')
      .trim();

    if (!text) {
      return NextResponse.json(
        { error: 'Mô hình không trả về nội dung. Vui lòng thử lại.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ report: text, taskCount: limited.length });
  } catch (error) {
    console.error('Lỗi khi tạo báo cáo:', error);
    return NextResponse.json({ error: 'Không tạo được báo cáo.' }, { status: 500 });
  }
}
