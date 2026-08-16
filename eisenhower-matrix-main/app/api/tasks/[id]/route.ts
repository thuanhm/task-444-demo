import { NextResponse } from 'next/server';
import { getSql, WORKSPACE } from '@/lib/db';
import { checkAccess } from '@/lib/auth';
import { rowToTask, normalizeStatus, type TaskRow } from '@/lib/taskRow';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/tasks/:id
 * Cập nhật từng phần: nội dung, phòng phụ trách, người thực hiện,
 * hạn chót, loại việc, ghi chú, trạng thái.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const denied = checkAccess(request);
  if (denied) return denied;

  const limited = checkRateLimit(request, { scope: 'tasks', limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const { id } = await context.params;
  const taskId = Number(id);
  if (!Number.isFinite(taskId)) {
    return NextResponse.json({ error: 'Mã công việc không hợp lệ.' }, { status: 400 });
  }

  try {
    const body = await request.json();

    const text =
      typeof body?.text === 'string' ? body.text.trim().slice(0, 1000) : undefined;
    if (text !== undefined && !text) {
      return NextResponse.json({ error: 'Nội dung công việc đang để trống.' }, { status: 400 });
    }

    const optionalText = (value: unknown, max: number) =>
      typeof value === 'string' ? value.trim().slice(0, max) : null;

    const department = optionalText(body?.department, 200);
    const assignee = optionalText(body?.assignee, 200);
    const category = optionalText(body?.category, 200);
    const note = optionalText(body?.note, 2000);

    // Hạn chót: chuỗi rỗng nghĩa là gỡ bỏ hạn, không gửi nghĩa là giữ nguyên
    let dueDate: string | null | undefined;
    if (typeof body?.dueDate === 'string') {
      const value = body.dueDate.trim();
      dueDate = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
    }

    const status = body?.status !== undefined ? normalizeStatus(body.status) : null;

    const sql = getSql();
    const rows = (await sql`
      UPDATE tasks
      SET content    = COALESCE(${text ?? null}::text, content),
          department = COALESCE(${department}::text, department),
          assignee   = COALESCE(${assignee}::text, assignee),
          category   = COALESCE(${category}::text, category),
          note       = COALESCE(${note}::text, note),
          due_date   = CASE
                         WHEN ${dueDate === undefined}::boolean THEN due_date
                         WHEN ${dueDate ?? ''} = '' THEN NULL
                         ELSE ${dueDate ?? null}::date
                       END,
          status     = COALESCE(${status}::text, status),
          completed  = COALESCE(${status}::text, status) = 'hoan-thanh'
      WHERE id = ${taskId} AND workspace = ${WORKSPACE}
      RETURNING id, quadrant, content, department, assignee, category, note, due_date, status
    `) as unknown as TaskRow[];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy công việc.' }, { status: 404 });
    }

    return NextResponse.json({ task: rowToTask(rows[0]) });
  } catch (error) {
    console.error('Lỗi khi cập nhật công việc:', error);
    return NextResponse.json({ error: 'Không cập nhật được công việc.' }, { status: 500 });
  }
}

/** DELETE /api/tasks/:id - xóa một công việc */
export async function DELETE(request: Request, context: RouteContext) {
  const denied = checkAccess(request);
  if (denied) return denied;

  const limited = checkRateLimit(request, { scope: 'tasks', limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const { id } = await context.params;
  const taskId = Number(id);
  if (!Number.isFinite(taskId)) {
    return NextResponse.json({ error: 'Mã công việc không hợp lệ.' }, { status: 400 });
  }

  try {
    const sql = getSql();
    await sql`DELETE FROM tasks WHERE id = ${taskId} AND workspace = ${WORKSPACE}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Lỗi khi xóa công việc:', error);
    return NextResponse.json({ error: 'Không xóa được công việc.' }, { status: 500 });
  }
}
