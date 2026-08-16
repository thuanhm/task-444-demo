import { NextResponse } from 'next/server';
import { getSql, WORKSPACE } from '@/lib/db';
import { checkAccess } from '@/lib/auth';
import { rowToTask, sanitizeInput, type TaskRow } from '@/lib/taskRow';
import { checkRateLimit } from '@/lib/rateLimit';
import { QUADRANTS } from '@/constants';
import type { QuadrantType, TasksByQuadrant } from '@/types';

export const dynamic = 'force-dynamic';

const QUADRANT_IDS = QUADRANTS.map((q) => q.id) as QuadrantType[];

const emptyBoard = (): TasksByQuadrant => ({
  'urgent-important': [],
  'not-urgent-important': [],
  'urgent-not-important': [],
  'not-urgent-not-important': [],
});

/** GET /api/tasks - lấy toàn bộ công việc, nhóm theo 4 góc phần tư */
export async function GET(request: Request) {
  const denied = checkAccess(request);
  if (denied) return denied;

  const limited = checkRateLimit(request, { scope: 'tasks', limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const sql = getSql();
    const rows = (await sql`
      SELECT id, quadrant, content, department, assignee, category, note, due_date, status
      FROM tasks
      WHERE workspace = ${WORKSPACE}
      ORDER BY position ASC, id DESC
    `) as unknown as (TaskRow & { quadrant: QuadrantType })[];

    const board = emptyBoard();
    for (const row of rows) {
      if (!QUADRANT_IDS.includes(row.quadrant)) continue;
      board[row.quadrant].push(rowToTask(row));
    }

    return NextResponse.json({ tasks: board });
  } catch (error) {
    console.error('Lỗi khi tải danh sách công việc:', error);
    return NextResponse.json(
      { error: 'Không tải được danh sách công việc.' },
      { status: 500 },
    );
  }
}

/** POST /api/tasks - thêm công việc mới, đặt lên đầu nhóm */
export async function POST(request: Request) {
  const denied = checkAccess(request);
  if (denied) return denied;

  const limited = checkRateLimit(request, { scope: 'tasks', limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const quadrant = body?.quadrant as QuadrantType;
    const input = sanitizeInput(body ?? {});

    if (!QUADRANT_IDS.includes(quadrant)) {
      return NextResponse.json({ error: 'Nhóm công việc không hợp lệ.' }, { status: 400 });
    }
    if (!input.text) {
      return NextResponse.json({ error: 'Nội dung công việc đang để trống.' }, { status: 400 });
    }

    const sql = getSql();
    const rows = (await sql`
      INSERT INTO tasks (
        workspace, quadrant, content, department, assignee, category, note,
        due_date, status, completed, position
      )
      VALUES (
        ${WORKSPACE}, ${quadrant}, ${input.text}, ${input.department}, ${input.assignee},
        ${input.category}, ${input.note}, ${input.dueDate}::date, ${input.status},
        ${input.status === 'hoan-thanh'},
        COALESCE((SELECT MIN(position) - 1 FROM tasks
                  WHERE workspace = ${WORKSPACE} AND quadrant = ${quadrant}), 0)
      )
      RETURNING id, quadrant, content, department, assignee, category, note, due_date, status
    `) as unknown as TaskRow[];

    return NextResponse.json({ task: rowToTask(rows[0]), quadrant });
  } catch (error) {
    console.error('Lỗi khi thêm công việc:', error);
    return NextResponse.json({ error: 'Không thêm được công việc.' }, { status: 500 });
  }
}

/** DELETE /api/tasks - xóa toàn bộ công việc của đơn vị */
export async function DELETE(request: Request) {
  const denied = checkAccess(request);
  if (denied) return denied;

  const limited = checkRateLimit(request, { scope: 'tasks', limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const sql = getSql();
    await sql`DELETE FROM tasks WHERE workspace = ${WORKSPACE}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Lỗi khi xóa toàn bộ công việc:', error);
    return NextResponse.json({ error: 'Không xóa được danh sách.' }, { status: 500 });
  }
}
