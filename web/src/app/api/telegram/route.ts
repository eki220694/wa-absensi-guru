import { NextRequest, NextResponse } from 'next/server';
import { getBot, setup } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

let initialized = false;

export async function POST(req: NextRequest) {
  try {
    if (!initialized) {
      setup();
      await getBot().init();
      initialized = true;
    }
    const update = await req.json();
    await getBot().handleUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Telegram webhook error:', e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', bot: 'Absensi SMAN 6 SIGI' });
}
