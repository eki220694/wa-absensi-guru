import type { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { checkGuru } from '../middleware/auth.js';
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

  // Route active session first — Task 4 will flesh this out
  if (session.step !== 'idle') {
    // Placeholder for future session routing
    return;
  }

  // Route by command
  if (text === '/absen' || text === 'absen' || text === '1') {
    await sock.sendMessage(jid, { text: `Halo ${guru.nama}! Fitur absen akan segera tersedia.` });
  } else if (text === '/izin' || text === 'izin' || text === '2') {
    await sock.sendMessage(jid, { text: `Halo ${guru.nama}! Fitur izin akan segera tersedia.` });
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
