import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { status } = body;
  if (!['disetujui', 'ditolak'].includes(status)) {
    return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
  }

  const adminId = (session.user as Record<string, unknown>).id;
  if (!adminId) return NextResponse.json({ error: 'Admin ID tidak ditemukan' }, { status: 400 });

  await sql`
    UPDATE izin
    SET status = ${status},
        approved_by = ${adminId},
        approved_at = NOW()
    WHERE id = ${params.id}
  `;

  return NextResponse.json({ ok: true });
}