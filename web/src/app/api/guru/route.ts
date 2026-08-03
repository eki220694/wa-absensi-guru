import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { nip, nama, no_wa, jabatan, password_hash } = await req.json();
    if (!nip || !nama) return NextResponse.json({ error: 'NIP dan nama wajib' }, { status: 400 });
    let hashed = null;
    if (password_hash) {
      hashed = await bcrypt.hash(password_hash, 10);
    }
    await sql`INSERT INTO guru (nip, nama, no_wa, jabatan, password_hash)
      VALUES (${nip}, ${nama}, ${no_wa || null}, ${jabatan || 'guru'}, ${hashed})
      ON CONFLICT (nip) DO UPDATE SET nama=${nama}, no_wa=${no_wa || null}, jabatan=${jabatan || 'guru'}, password_hash=COALESCE(${hashed}, guru.password_hash)`;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await sql`SELECT id, nip, nama, no_wa, jabatan FROM guru ORDER BY nama`;
  return NextResponse.json(rows);
}
