import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const key = formData.get('key') as string;
  const value = formData.get('value') as string;

  if (!key) return NextResponse.json({ error: 'Key wajib' }, { status: 400 });

  await sql`INSERT INTO config (key, value) VALUES (${key}, ${value}) ON CONFLICT (key) DO UPDATE SET value = ${value}`;

  return NextResponse.redirect(new URL('/pengaturan', req.url));
}