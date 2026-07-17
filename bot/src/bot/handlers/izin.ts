import type { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { getSession, clearSession } from '../session.js';
import { checkRateLimit } from '../middleware/rateLimit.js';

export async function handleIzin(sock: WASocket, msg: WAMessage, noWa: string, _guruId: number, _nama: string) {
  const jid = msg.key.remoteJid!;
  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
  const session = getSession(noWa);

  if (!checkRateLimit(noWa)) {
    await sock.sendMessage(jid, { text: '⏰ Mohon tunggu sebentar.' });
    return;
  }

  if (text === '/cancel' && session.step !== 'idle') {
    clearSession(noWa);
    await sock.sendMessage(jid, { text: '❌ Dibatalkan.' });
    return;
  }

  if (session.step === 'idle') {
    await sock.sendMessage(jid, { text: 'Fitur izin dalam pengembangan.' });
    return;
  }

  // Clear any active izin session if somehow reached
  clearSession(noWa);
}
