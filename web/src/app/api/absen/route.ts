import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

function getWitaDate(): string {
  const d = new Date();
  return new Date(d.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const tanggal = url.searchParams.get('tanggal') || getWitaDate();
  const guruId = url.searchParams.get('guru_id');

  let rows;
  if (guruId) {
    rows = await sql`
      SELECT a.*, g.nama as guru, j.kelas, j.mapel
      FROM absen a
      JOIN guru g ON a.guru_id = g.id
      JOIN jadwal j ON a.jadwal_id = j.id
      WHERE a.tanggal = ${tanggal} AND a.guru_id = ${guruId}
      ORDER BY a.jam_ke
    `;
  } else {
    rows = await sql`
      SELECT a.*, g.nama as guru, j.kelas, j.mapel
      FROM absen a
      JOIN guru g ON a.guru_id = g.id
      JOIN jadwal j ON a.jadwal_id = j.id
      WHERE a.tanggal = ${tanggal}
      ORDER BY g.nama, a.jam_ke
    `;
  }

  return NextResponse.json(rows);
}
