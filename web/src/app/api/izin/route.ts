import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`
    SELECT i.*, g.nama as guru
    FROM izin i
    JOIN guru g ON i.guru_id = g.id
    ORDER BY i.created_at DESC
    LIMIT 50
  `;

  return NextResponse.json(rows);
}
