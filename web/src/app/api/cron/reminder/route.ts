import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const d = new Date();
  const wita = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const menit = wita.getUTCHours() * 60 + wita.getUTCMinutes();
  const hari = wita.getUTCDay() === 0 ? 7 : wita.getUTCDay();
  const tgl = wita.toISOString().slice(0, 10);

  // Filter jadwal yang waktunya sudah dekat (15 menit sebelum mulai sampai 30 menit setelah selesai)
  const rows = await sql`
    SELECT g.*, j.id as jadwal_id, j.mapel, j.kelas, j.jam_ke,
      CAST(SPLIT_PART(j.jam_mulai::text, ':', 1) AS INT) * 60 + CAST(SPLIT_PART(j.jam_mulai::text, ':', 2) AS INT) as mulai_menit,
      CAST(SPLIT_PART(j.jam_selesai::text, ':', 1) AS INT) * 60 + CAST(SPLIT_PART(j.jam_selesai::text, ':', 2) AS INT) as selesai_menit
    FROM guru g
    JOIN jadwal j ON j.guru_id = g.id
    WHERE j.hari = ${hari}
      AND g.telegram_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM absen a
        WHERE a.guru_id = g.id AND a.jadwal_id = j.id AND a.tanggal = ${tgl}
      )
      AND NOT EXISTS (
        SELECT 1 FROM izin i
        WHERE i.guru_id = g.id
          AND i.status IN ('pending', 'disetujui')
          AND i.tanggal_mulai <= ${tgl} AND i.tanggal_selesai >= ${tgl}
      )
  `;

  const nearby = rows.filter((r: any) => {
    const mulai = r.mulai_menit - 15;
    const selesai = r.selesai_menit + 30;
    return menit >= mulai && menit <= selesai;
  });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: 'No bot token' }, { status: 500 });

  let sent = 0;
  for (const r of nearby as any[]) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: r.telegram_id,
          text: `⏰ *Reminder Absen*\nJam ke-${r.jam_ke}: ${r.mapel} — ${r.kelas}\n\nKetik /absen untuk absen sekarang.`,
          parse_mode: 'Markdown',
        }),
      });
      sent++;
    } catch (e) {
      console.error('Failed to send reminder to', r.telegram_id, e);
    }
  }

  return NextResponse.json({ sent, total: nearby.length });
}
