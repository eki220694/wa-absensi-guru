import { NextRequest, NextResponse } from 'next/server';
import { getBot, setup } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

let initialized = false;

export async function POST(req: NextRequest) {
  try {
    if (!initialized) {
      console.log('Bot initializing...');
      setup();
      await getBot().init();
      console.log('Bot initialized OK, bot info:', getBot().botInfo?.username);
      initialized = true;
    }
    const update = await req.json();
    console.log('Webhook update:', JSON.stringify({ id: update.update_id, type: update.callback_query ? 'callback' : update.message?.text ? 'text:' + update.message.text.substring(0, 30) : 'other' }));
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
