import { NextResponse } from 'next/server';
import { checkAccess } from '@/lib/auth';
import { buildReportPrompt, type ReportOptions, type ReportTask } from '@/lib/reportPrompt';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DEFAULT_MODEL = 'gemini-2.0-flash';

/**
 * POST /api/report
 * Sinh báo cáo hành chính từ danh sách nhiệm vụ, dùng Google Gemini Flash.
 * Khóa API chỉ nằm ở máy chủ, không lộ ra trình duyệt.
 */
export async function POST(request: Request) {
  const denied = checkAccess(request);
  if (denied) return denied;

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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 4096,
          },
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error('Gemini trả về lỗi:', response.status, detail.slice(0, 500));
      return NextResponse.json(
        { error: `Dịch vụ tạo báo cáo báo lỗi (mã ${response.status}).` },
        { status: 502 },
      );
    }

    const data = await response.json();
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
