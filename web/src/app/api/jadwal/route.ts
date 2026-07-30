import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { guru_id, hari, jam_ke, jam_mulai, jam_selesai, kelas, mapel, ruangan, semester, tahun_ajaran } = await req.json();
    if (!guru_id || !hari || !jam_ke || !jam_mulai || !jam_selesai || !kelas || !mapel || !semester || !tahun_ajaran) {
      return NextResponse.json({ error: 'Field wajib kosong' }, { status: 400 });
    }
    await sql`INSERT INTO jadwal (guru_id, hari, jam_ke, jam_mulai, jam_selesai, kelas, mapel, ruangan, semester, tahun_ajaran)
      VALUES (${guru_id}, ${hari}, ${jam_ke}, ${jam_mulai}, ${jam_selesai}, ${kelas}, ${mapel}, ${ruangan || null}, ${semester}, ${tahun_ajaran})
      ON CONFLICT (guru_id, hari, jam_ke, semester, tahun_ajaran) DO UPDATE SET
        jam_mulai=${jam_mulai}, jam_selesai=${jam_selesai}, kelas=${kelas}, mapel=${mapel}, ruangan=${ruangan || null}`;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await sql`SELECT j.*, g.nama as guru_nama FROM jadwal j JOIN guru g ON j.guru_id = g.id ORDER BY j.hari, j.jam_ke`;
  return NextResponse.json(rows);
}