import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { nip, nama, no_wa, jabatan, password_hash } = await req.json();
    if (!nip || !nama) return NextResponse.json({ error: 'NIP dan nama wajib' }, { status: 400 });
    if (password_hash) {
      const hashed = await bcrypt.hash(password_hash, 10);
      await sql`UPDATE guru SET nip=${nip}, nama=${nama}, no_wa=${no_wa || null}, jabatan=${jabatan || 'guru'}, password_hash=${hashed} WHERE id=${params.id}`;
    } else {
      await sql`UPDATE guru SET nip=${nip}, nama=${nama}, no_wa=${no_wa || null}, jabatan=${jabatan || 'guru'} WHERE id=${params.id}`;
    }
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await sql`DELETE FROM guru WHERE id = ${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
