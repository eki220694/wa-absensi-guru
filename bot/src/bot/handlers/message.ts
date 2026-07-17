import type { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { checkGuru } from '../middleware/auth.js';
import { handleAbsen } from './absen.js';
import { handleIzin } from './izin.js';
import { getSession } from '../session.js';

export async function messageHandler(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
  const noWa = jid.replace(/[^0-9]/g, '');

  if (!text && !msg.message?.locationMessage && !msg.message?.imageMessage) return;

  // Check auth
  const guru = await checkGuru(noWa);
  if (!guru) {
    await sock.sendMessage(jid, { text: 'Maaf, nomor ini tidak terdaftar. Hubungi admin.' });
    return;
  }

  const session = getSession(noWa);

  // Route active session first
  if (session.step !== 'idle') {
    if (session.step.startsWith('absen_')) {
      await handleAbsen(sock, msg, noWa, guru.id, guru.nama);
      return;
    }
    if (session.step.startsWith('izin_')) {
      await handleIzin(sock, msg, noWa, guru.id, guru.nama);
      return;
    }
  }

  // Route by command
  if (text === '/absen' || text === 'absen' || text === '1') {
    await handleAbsen(sock, msg, noWa, guru.id, guru.nama);
  } else if (text === '/izin' || text === 'izin' || text === '2') {
    await handleIzin(sock, msg, noWa, guru.id, guru.nama);
  } else if (text === '/help' || text === 'help' || text === '0') {
    await sock.sendMessage(jid, {
      text: `📋 *Menu Absensi Guru*\n\n1️⃣ /absen - Absen masuk kelas\n2️⃣ /izin - Izin/Sakit/Cuti/Dinas\n0️⃣ /help - Bantuan ini`,
    });
  } else if (text && text !== '') {
    await sock.sendMessage(jid, {
      text: `Halo ${guru.nama}! Ketik /help untuk menu.`,
    });
  }
}
