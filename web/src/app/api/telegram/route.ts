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
    console.error('Error stack:', e instanceof Error ? e.stack : 'no stack');
    // Always return 200 to Telegram — otherwise it retries endlessly
    return NextResponse.json({ ok: true, debug: e instanceof Error ? e.message : String(e) });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', bot: 'Absensi SMAN 6 SIGI' });
}
