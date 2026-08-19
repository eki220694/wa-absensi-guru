import { Bot, Context, Keyboard, InlineKeyboard } from 'grammy';
import { sql } from './db';
import { hitungJarak } from '@wa-absensi/shared';
import { SEKOLAH, RADIUS_METER } from '@wa-absensi/shared';
import type { Guru } from '@wa-absensi/shared';
import { compare } from 'bcryptjs';

let _bot: Bot | null = null;

function getBot(): Bot {
  if (!_bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set');
    _bot = new Bot(token);
  }
  return _bot;
}

// ─── Session ─────────────────────────────────────
interface Session {
  step: string | null;
  guruId: number;
  jadwalId: number;
  izinJenis: string;
  izinTglMulai: string;
  izinTglSelesai: string;
  izinAlasan: string;
  tanggal?: string;
}

function emptySession(): Session {
  return { step: null, guruId: 0, jadwalId: 0, izinJenis: '', izinTglMulai: '', izinTglSelesai: '', izinAlasan: '', tanggal: '' };
}

async function loadSession(chatId: string): Promise<Session> {
  const rows = await sql`SELECT data FROM bot_session WHERE chat_id = ${chatId}`;
  if (!rows.length) return emptySession();
  let raw = (rows[0] as Record<string, unknown>).data;
  if (!raw) return emptySession();
  // neon/postgres auto-parses JSONB — only JSON.parse if it's a string
  return typeof raw === 'string' ? JSON.parse(raw) : raw as Session;
}

async function saveSession(chatId: string, s: Session) {
  // postgres.js handles JSONB params natively — send object, not stringified
  await sql`INSERT INTO bot_session (chat_id, data, updated_at) VALUES (${chatId}, ${s as any}, NOW())
            ON CONFLICT (chat_id) DO UPDATE SET data = ${s as any}, updated_at = NOW()`;
}

async function dropSession(chatId: string) {
  await sql`DELETE FROM bot_session WHERE chat_id = ${chatId}`;
}

// ─── Helpers ──────────────────────────────────────
async function guruByTelegram(chatId: string): Promise<Guru | null> {
  const rows = await sql`SELECT * FROM guru WHERE telegram_id = ${chatId}`;
  return rows.length ? (rows[0] as unknown as Guru) : null;
}

function tglId(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function wita(): Date {
  const d = new Date();
  return new Date(d.getTime() + 8 * 60 * 60 * 1000);
}

function hariNama(): string {
  return ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][wita().getUTCDay()] ?? 'Minggu';
}

function isNearby(jamMulai: string, jamSelesai: string): boolean {
  const now = wita();
  const hm = now.getUTCHours() * 60 + now.getUTCMinutes();
  const [startH, startM] = jamMulai.split(':').map(Number) as [number, number];
  const [endH, endM] = jamSelesai.split(':').map(Number) as [number, number];
  const start = startH * 60 + startM - 15; // buffer 15 menit sebelum
  const end = endH * 60 + endM + 30;        // buffer 30 menit sesudah
  return hm >= start && hm <= end;
}

async function getVal(key: string): Promise<string | null> {
  const rows = await sql`SELECT value FROM config WHERE key = ${key}`;
  return rows.length ? ((rows[0] as any).value as string) : null;
}

// ─── Handlers ────────────────────────────────────
async function cmdStart(ctx: Context) {
  const chatId = String(ctx.chat!.id);
  const guru = await guruByTelegram(chatId);
  if (!guru) {
    return ctx.reply('👋 *Absensi SMAN 6 SIGI*\n\nBelum terdaftar.\nKetik `/daftar NIP password`\nContoh: `/daftar ADMIN001 admin123`', { parse_mode: 'Markdown' });
  }
  const kb = new Keyboard().text('✅ Absen').text('📋 Jadwal').row().text('🏖 Izin').text('📊 Cek Absen').row().text('❓ Bantuan').resized();
  return ctx.reply(`👋 Halo *${guru.nama}*\n📅 ${hariNama()}, ${tglId(wita().toISOString().slice(0, 10))}`, { parse_mode: 'Markdown', reply_markup: kb });
}

async function cmdDaftar(ctx: Context) {
  const chatId = String(ctx.chat!.id);
  const parts = ctx.message?.text?.split(' ').filter(Boolean) || [];
  if (parts.length < 3) return ctx.reply('Gunakan: `/daftar NIP password`', { parse_mode: 'Markdown' });
  const nip = parts[1];
  const pass = parts.slice(2).join(' ');
  const rows = await sql`SELECT * FROM guru WHERE nip = ${nip}`;
  if (!rows.length) return ctx.reply('❌ NIP tidak ditemukan.');
  const guru = rows[0] as unknown as Guru;
  if (!guru.password_hash) return ctx.reply('❌ Belum punya password. Hubungi admin.');
  if (!await compare(pass, guru.password_hash)) return ctx.reply('❌ Password salah.');
  await sql`UPDATE guru SET telegram_id = ${chatId} WHERE nip = ${nip}`;
  return ctx.reply('✅ Berhasil terdaftar! /start');
}

async function cmdAbsen(ctx: Context) {
  const chatId = String(ctx.chat!.id);
  const guru = await guruByTelegram(chatId);
  if (!guru) return ctx.reply('❌ Belum terdaftar.');
  const hari = wita().getUTCDay() === 0 ? 7 : wita().getUTCDay();
  if (hari === 7) return ctx.reply('📅 Minggu — libur.');
  const rows = await sql`SELECT j.* FROM jadwal j WHERE j.guru_id = ${guru.id} AND j.hari = ${hari} ORDER BY j.jam_ke`;
  if (!rows.length) return ctx.reply('📭 Tidak ada jadwal hari ini.');
  const nearby = rows.filter((r: any) => isNearby(r.jam_mulai, r.jam_selesai));
  if (!nearby.length) {
    let m = '⏰ *Jadwal hari ini*\n';
    for (const r of rows as any[]) {
      const sdh = await sql`SELECT id FROM absen WHERE guru_id=${guru.id} AND jadwal_id=${r.id} AND tanggal=${wita().toISOString().slice(0, 10)}`;
      m += `\n${r.jam_ke}. ${r.mapel} — ${r.kelas}${sdh.length ? ' ✅' : ''}`;
    }
    return ctx.reply(m + '\n\nBelum waktunya absen.', { parse_mode: 'Markdown' });
  }
  const ikb = new InlineKeyboard();
  for (const r of nearby as any[]) ikb.text(`${r.jam_ke}. ${r.mapel} ${r.kelas}`, `absen_${r.id}`).row();
  return ctx.reply('🗓 Pilih jadwal:', { reply_markup: ikb });
}

async function cmdJadwal(ctx: Context) {
  const chatId = String(ctx.chat!.id);
  const guru = await guruByTelegram(chatId);
  if (!guru) return ctx.reply('❌ Belum terdaftar.');
  const hari = wita().getUTCDay() === 0 ? 7 : wita().getUTCDay();
  const rows = await sql`SELECT j.* FROM jadwal j WHERE j.guru_id=${guru.id} AND j.hari=${hari} ORDER BY j.jam_ke`;
  if (!rows.length) return ctx.reply(`📭 Tidak ada jadwal ${hariNama()}.`);
  let m = `📋 *Jadwal ${hariNama()}*\n\n`;
  for (const r of rows as any[]) m += `${r.jam_ke}. *${r.mapel}*\n   ${r.kelas} ${r.ruangan ?? ''} (${r.jam_mulai}-${r.jam_selesai})\n\n`;
  return ctx.reply(m, { parse_mode: 'Markdown' });
}

async function cmdCek(ctx: Context) {
  const chatId = String(ctx.chat!.id);
  const guru = await guruByTelegram(chatId);
  if (!guru) return ctx.reply('❌ Belum terdaftar.');
  const tgl = wita().toISOString().slice(0, 10);
  const rows = await sql`SELECT a.*, j.mapel, j.kelas, j.jam_mulai, j.jam_selesai FROM absen a JOIN jadwal j ON a.jadwal_id=j.id WHERE a.guru_id=${guru.id} AND a.tanggal=${tgl} ORDER BY j.jam_ke`;
  if (!rows.length) return ctx.reply('📭 Belum ada absen hari ini.');
  let m = `📊 *Absen ${tglId(tgl)}*\n\n`;
  for (const r of rows as any[]) m += `${r.status === 'hadir' ? '✅' : r.status === 'terlambat' ? '⚠️' : '❌'} ${r.jam_ke}. ${r.mapel} — ${r.kelas} (${r.jam_mulai}-${r.jam_selesai})\n`;
  return ctx.reply(m, { parse_mode: 'Markdown' });
}

async function cmdIzin(ctx: Context) {
  const chatId = String(ctx.chat!.id);
  const guru = await guruByTelegram(chatId);
  if (!guru) return ctx.reply('❌ Belum terdaftar.');
  const ikb = new InlineKeyboard().text('🩺 Sakit', 'iz_sakit').text('🏖 Izin', 'iz_izin').row().text('✈️ Cuti', 'iz_cuti').text('🏢 Dinas', 'iz_dinas_luar');
  return ctx.reply('Pilih jenis:', { reply_markup: ikb });
}

async function cmdHelp(ctx: Context) {
  return ctx.reply('🤖 *Bantuan*\n/start — Menu\n/absen — Absen\n/jadwal — Jadwal\n/izin — Izin\n/cek — Cek absen\n/daftar NIP PASS — Login', { parse_mode: 'Markdown' });
}

// ─── Rate limit: sliding window 5 msg/min per chat (plan constraint) ──
const rateHits = new Map<string, number[]>();
function rateLimited(chatId: string): boolean {
  const now = Date.now();
  const recent = (rateHits.get(chatId) ?? []).filter(t => now - t < 60_000);
  if (recent.length >= 5) { rateHits.set(chatId, recent); return true; }
  recent.push(now);
  rateHits.set(chatId, recent);
  return false;
}
const rateLimitMw = async (ctx: Context, next: () => Promise<void>) => {
  const chatId = ctx.chat?.id;
  if (chatId !== undefined && rateLimited(String(chatId)))
    return ctx.reply('⏳ Terlalu cepat. Coba lagi sebentar lagi.');
  return next();
};

// ─── Register ────────────────────────────────────
function setup() {
  const b = getBot();
  b.use(rateLimitMw);
  b.command('start', cmdStart);
  b.command('daftar', cmdDaftar);
  b.command('absen', cmdAbsen);
  b.command('jadwal', cmdJadwal);
  b.command('cek', cmdCek);
  b.command('izin', cmdIzin);
  b.command('help', cmdHelp);
  b.command('skip', async (ctx) => {
    const chatId = String(ctx.chat!.id);
    const s = await loadSession(chatId);
    if (s.step === 'await_foto') {
      await dropSession(chatId);
      return ctx.reply('⏭️ Foto dilewati. Absen selesai!');
    }
    if (s.step === 'await_izin_bukti') await simpanIzin(chatId, s, null);
  });

  b.callbackQuery(/absen_(\d+)/, async (ctx) => {
    const chatId = String(ctx.chat!.id);
    const id = Number(ctx.match![1]);
    const guru = await guruByTelegram(chatId);
    if (!guru) return ctx.answerCallbackQuery('❌');
    const tgl = wita().toISOString().slice(0, 10);
    if ((await sql`SELECT id FROM absen WHERE guru_id=${guru.id} AND jadwal_id=${id} AND tanggal=${tgl}`).length) {
      return ctx.answerCallbackQuery('✅ Sudah absen.');
    }
    await saveSession(chatId, { step: 'await_gps', guruId: guru.id, jadwalId: id, izinJenis: '', izinTglMulai: '', izinTglSelesai: '', izinAlasan: '' });
    await ctx.editMessageText('📍 Kirim lokasi (📎 → Location).', { parse_mode: 'Markdown' });
    await ctx.answerCallbackQuery();
  });

  for (const j of ['izin', 'sakit', 'cuti', 'dinas_luar']) {
    b.callbackQuery(`iz_${j}`, async (ctx) => {
      const chatId = String(ctx.chat!.id);
      const guru = await guruByTelegram(chatId);
      if (!guru) return ctx.answerCallbackQuery('❌');
      await saveSession(chatId, { step: 'await_izin_tgl_mulai', guruId: guru.id, jadwalId: 0, izinJenis: j, izinTglMulai: '', izinTglSelesai: '', izinAlasan: '' });
      await ctx.editMessageText('📅 Tanggal *mulai*? (DD/MM/YYYY)', { parse_mode: 'Markdown' });
      await ctx.answerCallbackQuery();
    });
  }

  b.on(':location', async (ctx) => {
    const chatId = String(ctx.chat!.id);
    const s = await loadSession(chatId);
    if (s.step !== 'await_gps') return;
    const loc = ctx.message!.location!;
    const lat = Number(await getVal('latitude_sekolah') || SEKOLAH.latitude);
    const lng = Number(await getVal('longitude_sekolah') || SEKOLAH.longitude);
    const rad = Number(await getVal('radius_absen') || RADIUS_METER);
    const jarak = hitungJarak(loc.latitude, loc.longitude, lat, lng);
    const tgl = wita().toISOString().slice(0, 10);
    const jw = (await sql`SELECT j.*, g.nama as gn FROM jadwal j JOIN guru g ON j.guru_id=g.id WHERE j.id=${s.jadwalId}`)[0] as any;
    if (!jw) return ctx.reply('❌ Jadwal tidak ditemukan.');
    await sql`INSERT INTO absen (guru_id,jadwal_id,tanggal,jam_ke,status,di_luar_radius,jarak_meter,latitude,longitude)
      VALUES (${s.guruId},${s.jadwalId},${tgl},${jw.jam_ke},'hadir',${jarak > rad},${Math.round(jarak)},${loc.latitude},${loc.longitude})
      ON CONFLICT(guru_id,jadwal_id,tanggal) DO UPDATE SET status='hadir',di_luar_radius=${jarak > rad},jarak_meter=${Math.round(jarak)},latitude=${loc.latitude},longitude=${loc.longitude}`;
    s.step = 'await_foto';
    s.tanggal = tgl;
    await saveSession(chatId, s);
    await ctx.reply('📸 *Kirim foto kelas/selfie*\n atau /skip untuk lewati.', { parse_mode: 'Markdown' });
  });

  b.on(':photo', async (ctx) => {
    const chatId = String(ctx.chat!.id);
    const s = await loadSession(chatId);
    const file = await ctx.getFile();
    const url = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN!}/${file.file_path}`;
    if (s.step === 'await_foto') {
      await sql`UPDATE absen SET foto_path = ${url}, foto_valid = true WHERE guru_id = ${s.guruId} AND jadwal_id = ${s.jadwalId} AND tanggal = ${s.tanggal}`;
      await dropSession(chatId);
      return ctx.reply('✅ Foto tersimpan. Absen selesai!');
    }
    if (s.step === 'await_izin_bukti') {
      return simpanIzin(chatId, s, url);
    }
  });

  // Keyboard button handlers — use hears() for proper middleware chain
  b.hears('✅ Absen', cmdAbsen);
  b.hears('📋 Jadwal', cmdJadwal);
  b.hears('🏖 Izin', cmdIzin);
  b.hears('📊 Cek Absen', cmdCek);
  b.hears('❓ Bantuan', cmdHelp);

  // Text session handler
  b.on(':text', async (ctx) => {
    const chatId = String(ctx.chat!.id);
    const t = ctx.message!.text!.trim();
    let s: Session;
    try {
      s = await loadSession(chatId);
    } catch {
      s = emptySession();
    }
    if (!s.step) return;

    if (s.step === 'await_izin_tgl_mulai') {
      const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!m) return ctx.reply('Format DD/MM/YYYY');
      s.izinTglMulai = `${m[3]}-${m[2]}-${m[1]}`;
      s.step = 'await_izin_tgl_selesai';
      await saveSession(chatId, s);
      return ctx.reply('📅 Tanggal *selesai*? (DD/MM/YYYY)', { parse_mode: 'Markdown' });
    }
    if (s.step === 'await_izin_tgl_selesai') {
      const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!m) return ctx.reply('Format DD/MM/YYYY');
      s.izinTglSelesai = `${m[3]}-${m[2]}-${m[1]}`;
      s.step = 'await_izin_alasan';
      await saveSession(chatId, s);
      return ctx.reply('💬 Alasan?');
    }
    if (s.step === 'await_izin_alasan') {
      s.izinAlasan = t;
      s.step = 'await_izin_bukti';
      await saveSession(chatId, s);
      return ctx.reply('📎 Foto bukti atau /skip');
    }
    if (s.step === 'await_izin_bukti') {
      await simpanIzin(chatId, s, null);
    }
  });

  // Catch all middleware errors — prevent unhandled rejections
  b.catch((err) => {
    console.error('Bot middleware error:', err);
  });
}

async function simpanIzin(chatId: string, s: Session, bukti: string | null) {
  try {
    await sql`INSERT INTO izin (guru_id,jenis,tanggal_mulai,tanggal_selesai,alasan,bukti_path,status) VALUES (${s.guruId},${s.izinJenis},${s.izinTglMulai},${s.izinTglSelesai},${s.izinAlasan},${bukti},'pending')`;
    await dropSession(chatId);
    await getBot().api.sendMessage(chatId, `✅ *Izin terkirim*\n📋 ${s.izinJenis}\n📅 ${tglId(s.izinTglMulai)}–${tglId(s.izinTglSelesai)}\n💬 ${s.izinAlasan}\n⏳ Menunggu admin.`, { parse_mode: 'Markdown' });
  } catch (e) {
    await dropSession(chatId);
    const msg = e instanceof Error ? e.message : String(e);
    console.error('simpanIzin error:', msg);
    try {
      await getBot().api.sendMessage(chatId, `❌ Gagal menyimpan izin: ${msg}\nCoba lagi atau hubungi admin.`);
    } catch { /* ignore — token/session issue */ }
  }
}

export { getBot, setup };
