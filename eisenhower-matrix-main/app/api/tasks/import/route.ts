import { NextResponse } from 'next/server';
import { getSql, WORKSPACE } from '@/lib/db';
import { checkAccess } from '@/lib/auth';
import { sanitizeInput } from '@/lib/taskRow';
import { QUADRANTS } from '@/constants';
import type { QuadrantType } from '@/types';

export const dynamic = 'force-dynamic';

const QUADRANT_IDS = QUADRANTS.map((q) => q.id) as QuadrantType[];

/**
 * POST /api/tasks/import
 * Nhập hàng loạt công việc từ file Excel/CSV đã được đọc ở phía trình duyệt.
 * Body: { tasks: [{ quadrant, text, department, assignee, dueDate, category, status, note }] }
 */
export async function POST(request: Request) {
  const denied = checkAccess(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const list = Array.isArray(body?.tasks) ? body.tasks : [];

    if (list.length === 0) {
      return NextResponse.json({ error: 'Tệp không có dòng dữ liệu hợp lệ.' }, { status: 400 });
    }
    if (list.length > 1000) {
      return NextResponse.json({ error: 'Mỗi lần chỉ nhập tối đa 1.000 dòng.' }, { status: 400 });
    }

    const sql = getSql();
    let inserted = 0;

    for (const raw of list) {
      const quadrant = QUADRANT_IDS.includes(raw?.quadrant)
        ? (raw.quadrant as QuadrantType)
        : 'not-urgent-important';
      const input = sanitizeInput(raw ?? {});
      if (!input.text) continue;

      await sql`
        INSERT INTO tasks (
          workspace, quadrant, content, department, assignee, category, note,
          due_date, status, completed, position
        )
        VALUES (
          ${WORKSPACE}, ${quadrant}, ${input.text}, ${input.department}, ${input.assignee},
          ${input.category}, ${input.note}, ${input.dueDate}::date, ${input.status},
          ${input.status === 'hoan-thanh'},
          COALESCE((SELECT MAX(position) + 1 FROM tasks
                    WHERE workspace = ${WORKSPACE} AND quadrant = ${quadrant}), 0)
        )
      `;
      inserted += 1;
    }

    return NextResponse.json({ inserted });
  } catch (error) {
    console.error('Lỗi khi nhập dữ liệu:', error);
    return NextResponse.json({ error: 'Không nhập được dữ liệu từ tệp.' }, { status: 500 });
  }
}
