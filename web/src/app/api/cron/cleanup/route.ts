import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hours = parseInt(new URL(req.url).searchParams.get('hours') || '24', 10);
  const safeHours = isNaN(hours) ? 24 : hours;

  const before = await sql<{ c: number }>`
    SELECT COUNT(*)::int AS c FROM bot_session
    WHERE updated_at < NOW() - INTERVAL '${safeHours} hours'
  `;
  const toDelete = before[0]?.c ?? 0;

  if (toDelete > 0) {
    await sql`DELETE FROM bot_session
      WHERE updated_at < NOW() - INTERVAL '${safeHours} hours'`;
  }

  return NextResponse.json({
    ok: true,
    deleted: toDelete,
    message: `Cleaned bot_session older than ${safeHours} hours`,
  });
}
