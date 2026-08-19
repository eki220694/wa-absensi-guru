import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getBot } from '@/lib/telegram';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { status } = body;
  if (!['disetujui', 'ditolak'].includes(status)) {
    return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
  }

  const adminId = (session.user as Record<string, unknown>).id;
  if (!adminId) return NextResponse.json({ error: 'Admin ID tidak ditemukan' }, { status: 400 });

  // Get izin row with guru telegram_id before update
  const rows = await sql`
    SELECT i.*, g.telegram_id, g.nama as guru_nama
    FROM izin i
    JOIN guru g ON i.guru_id = g.id
    WHERE i.id = ${id}
  `;
  if (!rows.length) return NextResponse.json({ error: 'Izin tidak ditemukan' }, { status: 404 });
  const izin = rows[0] as any;

  await sql`
    UPDATE izin
    SET status = ${status},
        approved_by = ${adminId},
        approved_at = NOW()
    WHERE id = ${id}
  `;

  // Send Telegram notification to guru
  if (izin.telegram_id) {
    try {
      const statusLabel = status === 'disetujui' ? '✅ DISETUJUI' : '❌ DITOLAK';
      const tglMulai = new Date(izin.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const tglSelesai = new Date(izin.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      await getBot().api.sendMessage(
        izin.telegram_id,
        `${statusLabel}\n\nPengajuan izin Anda:\n📋 ${izin.jenis}\n📅 ${tglMulai} – ${tglSelesai}\n💬 ${izin.alasan || '-'}\n\nStatus: ${statusLabel}`
      );
    } catch (e) {
      console.error('Telegram notify error:', e);
    }
  }

  return NextResponse.json({ ok: true });
}