import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '7d';

  const days = range === '7d' ? 7 : range === '30d' ? 30 : 7;

  const daily = await sql`
    SELECT
      tanggal,
      COUNT(*) FILTER (WHERE status = 'hadir') AS hadir,
      COUNT(*) FILTER (WHERE status = 'terlambat') AS terlambat,
      COUNT(*) FILTER (WHERE status = 'tidak_hadir') AS tidak_hadir
    FROM absen
    WHERE tanggal >= CURRENT_DATE - INTERVAL '${days} days'
    GROUP BY tanggal
    ORDER BY tanggal ASC
  `;

  const total = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'hadir') AS hadir,
      COUNT(*) FILTER (WHERE status = 'terlambat') AS terlambat,
      COUNT(*) FILTER (WHERE status = 'tidak_hadir') AS tidak_hadir
    FROM absen
    WHERE tanggal >= CURRENT_DATE - INTERVAL '${days} days'
  `;

  const status = [
    { name: 'Hadir', value: Number(total[0]?.hadir ?? 0) },
    { name: 'Terlambat', value: Number(total[0]?.terlambat ?? 0) },
    { name: 'Tidak Hadir', value: Number(total[0]?.tidak_hadir ?? 0) },
  ];

  return NextResponse.json({
    daily: daily.map((d: any) => ({
      tanggal: d.tanggal,
      label: new Date(d.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      hadir: Number(d.hadir),
      terlambat: Number(d.terlambat),
      tidak_hadir: Number(d.tidak_hadir),
    })),
    status,
  });
}
