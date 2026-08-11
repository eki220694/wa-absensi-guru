import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

// Proxy foto absen: ambil file dari Telegram server-side.
// foto_path di DB berisi token bot -> jangan pernah dikirim ke browser.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const id = Number(url.searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const rows = await sql`SELECT foto_path FROM absen WHERE id = ${id}`;
  const foto = rows[0]?.foto_path as string | undefined;
  if (!foto || !foto.startsWith('https://api.telegram.org/file/bot')) {
    return NextResponse.json({ error: 'Foto tidak ditemukan' }, { status: 404 });
  }

  try {
    const res = await fetch(foto, { cache: 'no-store' });
    if (!res.ok) return NextResponse.json({ error: 'Foto gagal diambil' }, { status: 502 });
    const buf = Buffer.from(await res.arrayBuffer());
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Telegram tidak terjangkau' }, { status: 502 });
  }
}
