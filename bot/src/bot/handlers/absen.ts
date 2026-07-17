import type { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { sql } from '../../db/connection.js';
import { getSession, setSession, clearSession } from '../session.js';
import { checkRateLimit } from '../middleware/rateLimit.js';
import { verifyLocation } from '../../services/gps.js';
import { verifyPhoto } from '../../services/ocr.js';
import { savePhoto } from '../../services/photo.js';
import { sekarang, formatTanggal, HARI } from '@wa-absensi/shared';

export async function handleAbsen(sock: WASocket, msg: WAMessage, noWa: string, guruId: number, nama: string) {
  const jid = msg.key.remoteJid!;
  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
  const session = getSession(noWa);

  if (!checkRateLimit(noWa)) {
    await sock.sendMessage(jid, { text: '⏰ Mohon tunggu sebentar. Terlalu banyak permintaan.' });
    return;
  }

  if (session.step === 'idle') {
    // Start: query today's schedule ±1 hour
    const skrg = sekarang();
    const jadwalRows = await sql`
      SELECT * FROM jadwal
      WHERE guru_id = ${guruId}
        AND hari = ${skrg.hari}
        AND jam_ke BETWEEN ${Math.max(1, skrg.jamKe - 1)} AND ${Math.min(10, skrg.jamKe + 1)}
      ORDER BY jam_ke
      LIMIT 5
    `;

    if (!jadwalRows || jadwalRows.length === 0) {
      await sock.sendMessage(jid, { text: '📭 Tidak ada jadwal mengajar saat ini.' });
      return;
    }

    const list = (jadwalRows as any[]).map((j, i) =>
      `${i + 1}. ${j.mapel} - ${j.kelas} - Jam ${j.jam_ke} (${j.jam_mulai.slice(0, 5)}-${j.jam_selesai.slice(0, 5)})${j.ruangan ? ' - ' + j.ruangan : ''}`
    ).join('\n');

    setSession(noWa, {
      step: 'absen_pilih_jadwal',
      data: { jadwal: jadwalRows, nama, guruId },
    });

    await sock.sendMessage(jid, {
      text: `✅ *Absen Masuk*\n${HARI[skrg.hari]}, ${formatTanggal(new Date().toISOString().slice(0, 10))}\n\nPilih jadwal:\n${list}\n\nKetik nomor (1-${jadwalRows.length}).`,
    });
    return;
  }

  if (session.step === 'absen_pilih_jadwal') {
    const idx = parseInt(text) - 1;
    const jadwalList = session.data.jadwal as any[];
    const selected = jadwalList[idx];

    if (!selected) {
      await sock.sendMessage(jid, { text: '❌ Pilihan tidak valid. Coba lagi.' });
      return;
    }

    session.data.selectedJadwal = selected;
    session.step = 'absen_kirim_gps';
    await sock.sendMessage(jid, {
      text: '📍 *Kirim lokasi* (tekan attachment > Location / Lokasi)\n\nAtau ketik /skip jika tidak bisa kirim GPS.',
    });
    return;
  }

  if (session.step === 'absen_kirim_gps') {
    let lat: number | null = null;
    let lng: number | null = null;

    const loc = msg.message?.locationMessage;
    if (loc && loc.degreesLatitude !== undefined && loc.degreesLongitude !== undefined) {
      lat = loc.degreesLatitude;
      lng = loc.degreesLongitude;
    } else if (text === '/skip') {
      // proceed without GPS
    } else {
      await sock.sendMessage(jid, { text: '📍 Kirim lokasi atau ketik /skip.' });
      return;
    }

    let jarak: number | null = null;
    let diLuarRadius = false;
    if (lat !== null && lng !== null) {
      const result = verifyLocation(lat, lng);
      jarak = result.jarak;
      diLuarRadius = result.diLuarRadius;
    }

    session.data.lokasi = { lat, lng, jarak, diLuarRadius };
    session.step = 'absen_kirim_foto';
    await sock.sendMessage(jid, {
      text: '📸 *Kirim foto kelas*\nPastikan terlihat nama kelas/papan tulis.\n\nKetik /skip jika tidak bisa kirim foto.',
    });
    return;
  }

  if (session.step === 'absen_kirim_foto') {
    let fotoPath: string | null = null;
    let fotoValid = false;

    if (msg.message?.imageMessage) {
      const buffer = await downloadMediaMessage(msg, 'buffer', {});
      if (buffer) {
        const tanggal = new Date().toISOString().slice(0, 10);
        const jamKe = (session.data.selectedJadwal as any).jam_ke;
        fotoPath = await savePhoto(buffer as Buffer, guruId, tanggal, jamKe);
        // OCR check
        const selected = session.data.selectedJadwal as any;
        const teksKelas = `${selected.kelas}${selected.ruangan ? ' ' + selected.ruangan : ''}`;
        if (teksKelas.trim()) {
          const ocrResult = await verifyPhoto(fotoPath, teksKelas);
          fotoValid = ocrResult.valid;
        } else {
          fotoValid = true;
        }
      }
    } else if (text === '/skip') {
      // proceed without photo
    } else {
      await sock.sendMessage(jid, { text: '📸 Kirim foto atau ketik /skip.' });
      return;
    }

    // Save absen
    const selected = session.data.selectedJadwal as any;
    const loc = session.data.lokasi as any;
    const tanggal = new Date().toISOString().slice(0, 10);

    try {
      await sql`
        INSERT INTO absen (guru_id, jadwal_id, tanggal, jam_ke, status, di_luar_radius, jarak_meter, latitude, longitude, foto_path, foto_valid)
        VALUES (${guruId}, ${selected.id}, ${tanggal}, ${selected.jam_ke}, 'hadir', ${loc.diLuarRadius}, ${loc.jarak}, ${loc.lat}, ${loc.lng}, ${fotoPath}, ${fotoValid})
      `;

      const gpsLine = loc.jarak !== null
        ? (loc.diLuarRadius ? `⚠️ Di luar radius (${loc.jarak}m)` : `✅ ${loc.jarak}m dari sekolah`)
        : 'ℹ️ GPS tidak tersedia';

      const fotoLine = fotoPath
        ? (fotoValid ? '✅ Foto valid' : '⚠️ Foto (periksa oleh admin)')
        : 'ℹ️ Foto tidak tersedia';

      await sock.sendMessage(jid, {
        text: `✅ *Absen Tercatat*\n\n📅 ${formatTanggal(tanggal)}\n⏰ Jam ${selected.jam_ke} (${selected.jam_mulai.slice(0, 5)}-${selected.jam_selesai.slice(0, 5)})\n👨‍🏫 ${nama}\n📚 ${selected.mapel}\n🏫 ${selected.kelas}${selected.ruangan ? ' - ' + selected.ruangan : ''}\n📍 ${gpsLine}\n📸 ${fotoLine}`,
      });
    } catch (err: unknown) {
      const msgErr = err instanceof Error ? err.message : String(err);
      if (msgErr.includes('unique') || msgErr.includes('duplicate')) {
        await sock.sendMessage(jid, { text: '⚠️ Absen jam ini sudah tercatat sebelumnya.' });
      } else {
        await sock.sendMessage(jid, { text: '❌ Gagal menyimpan absen. Coba lagi.' });
        console.error(err);
      }
    }

    clearSession(noWa);
    return;
  }
}
