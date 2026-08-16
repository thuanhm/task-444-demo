import { NextResponse } from 'next/server';
import { getSql, WORKSPACE } from '@/lib/db';
import { checkAccess } from '@/lib/auth';
import { QUADRANTS } from '@/constants';
import { checkRateLimit } from '@/lib/rateLimit';
import type { QuadrantType } from '@/types';

export const dynamic = 'force-dynamic';

const QUADRANT_IDS = QUADRANTS.map((q) => q.id) as QuadrantType[];

/**
 * POST /api/tasks/reorder
 * Body: { order: { "<nhóm>": [id, id, ...] } }
 * Lưu lại nhóm và thứ tự sau khi người dùng kéo - thả.
 */
export async function POST(request: Request) {
  const denied = checkAccess(request);
  if (denied) return denied;

  const limited = checkRateLimit(request, { scope: 'tasks', limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const order = body?.order as Record<string, number[]> | undefined;

    if (!order || typeof order !== 'object') {
      return NextResponse.json({ error: 'Dữ liệu sắp xếp không hợp lệ.' }, { status: 400 });
    }

    const ids: number[] = [];
    const quadrantOf: string[] = [];
    const positions: number[] = [];

    for (const quadrant of QUADRANT_IDS) {
      const list = order[quadrant];
      if (!Array.isArray(list)) continue;

      list.forEach((rawId, index) => {
        const id = Number(rawId);
        if (!Number.isFinite(id)) return;
        ids.push(id);
        quadrantOf.push(quadrant);
        positions.push(index);
      });
    }

    if (ids.length === 0) {
      return NextResponse.json({ ok: true });
    }

    // Cập nhật hàng loạt trong một câu lệnh duy nhất
    const sql = getSql();
    await sql`
      UPDATE tasks AS t
      SET quadrant = u.quadrant,
          position = u.position
      FROM (
        SELECT * FROM UNNEST(
          ${ids}::bigint[],
          ${quadrantOf}::text[],
          ${positions}::int[]
        ) AS x(id, quadrant, position)
      ) AS u
      WHERE t.id = u.id AND t.workspace = ${WORKSPACE}
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Lỗi khi lưu thứ tự công việc:', error);
    return NextResponse.json({ error: 'Không lưu được thứ tự mới.' }, { status: 500 });
  }
}
