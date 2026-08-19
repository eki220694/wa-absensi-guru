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

    // Auto-fill absen izin when status becomes 'disetujui'
  if (status === 'disetujui' && izin.status !== 'disetujui') {
    const from = new Date(izin.tanggal_mulai);
    const to = new Date(izin.tanggal_selesai);
    const hariMap: Record<number, number> = { 0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
    for (let d = new Date(from); d <= to; d = new Date(d.getTime() + 86400000)) {
      const iso = d.toISOString().slice(0, 10);
      const hari = hariMap[d.getUTCDay()];
      await sql`
        INSERT INTO absen (guru_id, jadwal_id, tanggal, jam_ke, status, keterangan)
        SELECT ${izin.guru_id}, j.id, ${iso}::date, j.jam_ke, 'izin', ${izin.jenis}
        FROM jadwal j
        WHERE j.guru_id = ${izin.guru_id} AND j.hari = ${hari}
        ON CONFLICT (guru_id, jadwal_id, tanggal) DO NOTHING
      `;
    }
  }

  // Clean up auto-filled absen 'izin' rows when status reverted to 'ditolak'
  if (status === 'ditolak' && izin.status === 'disetujui') {
    await sql`
      DELETE FROM absen
      WHERE guru_id = ${izin.guru_id}
        AND status = 'izin'
        AND keterangan = ${izin.jenis}
        AND tanggal BETWEEN ${izin.tanggal_mulai}::date AND ${izin.tanggal_selesai}::date
    `;
  }

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