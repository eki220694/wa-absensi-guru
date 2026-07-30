import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { nip, nama, no_wa, jabatan, password_hash } = await req.json();
    if (!nip || !nama) return NextResponse.json({ error: 'NIP dan nama wajib' }, { status: 400 });
    await sql`INSERT INTO guru (nip, nama, no_wa, jabatan, password_hash)
      VALUES (${nip}, ${nama}, ${no_wa || null}, ${jabatan || 'guru'}, ${password_hash || null})
      ON CONFLICT (nip) DO UPDATE SET nama=${nama}, no_wa=${no_wa || null}, jabatan=${jabatan || 'guru'}`;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await sql`SELECT id, nip, nama, no_wa, jabatan FROM guru ORDER BY nama`;
  return NextResponse.json(rows);
}
