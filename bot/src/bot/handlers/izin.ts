import type { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { sql } from '../../db/connection.js';
import { getSession, setSession, clearSession } from '../session.js';
import { checkRateLimit } from '../middleware/rateLimit.js';
import { formatTanggal, JENIS_IZIN } from '@wa-absensi/shared';
import fs from 'fs/promises';
import path from 'path';

export async function handleIzin(sock: WASocket, msg: WAMessage, noWa: string, guruId: number, nama: string) {
  const jid = msg.key.remoteJid!;
  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
  const session = getSession(noWa);

  if (!checkRateLimit(noWa)) {
    await sock.sendMessage(jid, { text: '⏰ Mohon tunggu sebentar.' });
    return;
  }

  if (session.step === 'idle') {
    const jenisList = JENIS_IZIN.map((j, i) => `${i + 1}. ${j.charAt(0).toUpperCase() + j.slice(1)}`).join('\n');
    setSession(noWa, { step: 'izin_pilih_jenis', data: { guruId, nama } });
    await sock.sendMessage(jid, { text: `📋 *Pengajuan Izin*\n\nPilih jenis:\n${jenisList}\n\nKetik nomor (1-4).` });
    return;
  }

  if (session.step === 'izin_pilih_jenis') {
    const idx = parseInt(text) - 1;
    const jenis = JENIS_IZIN[idx];
    if (!jenis) {
      await sock.sendMessage(jid, { text: '❌ Pilihan tidak valid.' });
      return;
    }
    session.data.jenis = jenis;
    session.step = 'izin_tanggal_mulai';
    await sock.sendMessage(jid, { text: '📅 Tanggal mulai? (DD/MM/YYYY)' });
    return;
  }

  if (session.step === 'izin_tanggal_mulai') {
    const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      await sock.sendMessage(jid, { text: '📅 Format: DD/MM/YYYY. Contoh: 17/07/2026' });
      return;
    }
    session.data.tanggalMulai = `${match[3]}-${match[2]}-${match[1]}`;
    session.step = 'izin_tanggal_selesai';
    await sock.sendMessage(jid, { text: '📅 Tanggal selesai? (DD/MM/YYYY)' });
    return;
  }

  if (session.step === 'izin_tanggal_selesai') {
    const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      await sock.sendMessage(jid, { text: '📅 Format: DD/MM/YYYY' });
      return;
    }
    session.data.tanggalSelesai = `${match[3]}-${match[2]}-${match[1]}`;
    session.step = 'izin_alasan';
    await sock.sendMessage(jid, { text: '✏️ Alasan singkat?' });
    return;
  }

  if (session.step === 'izin_alasan') {
    session.data.alasan = text;
    session.step = 'izin_bukti';
    await sock.sendMessage(jid, { text: '📎 Kirim bukti (foto surat/SK) atau ketik /skip' });
    return;
  }

  if (session.step === 'izin_bukti') {
    let buktiPath: string | null = null;

    if (msg.message?.imageMessage) {
      const buffer = await downloadMediaMessage(msg, 'buffer', {});
      if (buffer) {
        const dir = `/data/photos/bukti/${guruId}`;
        await fs.mkdir(dir, { recursive: true });
        const filename = `izin_${Date.now()}.jpg`;
        buktiPath = path.join(dir, filename);
        await fs.writeFile(buktiPath, buffer as Buffer);
      }
    }

    const { jenis, tanggalMulai, tanggalSelesai, alasan } = session.data;

    await sql`
      INSERT INTO izin (guru_id, jenis, tanggal_mulai, tanggal_selesai, alasan, status)
      VALUES (${guruId}, ${jenis}, ${tanggalMulai}, ${tanggalSelesai}, ${alasan}, 'pending')
    `;

    await sock.sendMessage(jid, {
      text: `✅ *Pengajuan Izin Terkirim*\n\n📋 ${jenis.charAt(0).toUpperCase() + jenis.slice(1)}\n📅 ${formatTanggal(tanggalMulai)} - ${formatTanggal(tanggalSelesai)}\n💬 ${alasan}\n\n⏳ Menunggu persetujuan admin.`,
    });

    clearSession(noWa);
    return;
  }
}
