import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../../data/absensi.db');

export function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function setupDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS guru (
      id TEXT PRIMARY KEY,
      nama TEXT NOT NULL,
      no_wa TEXT UNIQUE NOT NULL,
      nuptk TEXT
    );

    CREATE TABLE IF NOT EXISTS mapel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS kelas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS jadwal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hari TEXT NOT NULL CHECK(hari IN ('senin','selasa','rabu','kamis','jumat','sabtu')),
      jam_ke INTEGER NOT NULL CHECK(jam_ke BETWEEN 1 AND 10),
      kelas_id INTEGER NOT NULL REFERENCES kelas(id),
      mapel_id INTEGER NOT NULL REFERENCES mapel(id),
      guru_id TEXT NOT NULL REFERENCES guru(id),
      jam_mulai TEXT NOT NULL,
      jam_selesai TEXT NOT NULL,
      UNIQUE(hari, jam_ke, kelas_id)
    );

    CREATE TABLE IF NOT EXISTS absensi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guru_id TEXT NOT NULL REFERENCES guru(id),
      tanggal DATE NOT NULL DEFAULT (date('now','localtime')),
      jam_ke INTEGER NOT NULL CHECK(jam_ke BETWEEN 1 AND 10),
      kelas_id INTEGER NOT NULL REFERENCES kelas(id),
      mapel_id INTEGER NOT NULL REFERENCES mapel(id),
      waktu_absen TEXT NOT NULL DEFAULT (time('now','localtime')),
      status TEXT DEFAULT 'hadir' CHECK(status IN ('hadir','sakit','izin','tanpa_keterangan')),
      UNIQUE(guru_id, tanggal, jam_ke)
    );

    CREATE VIEW IF NOT EXISTS rekap_harian AS
      SELECT
        g.nama AS guru,
        k.nama AS kelas,
        m.nama AS mapel,
        a.jam_ke,
        a.waktu_absen,
        a.status,
        a.tanggal
      FROM absensi a
      JOIN guru g ON g.id = a.guru_id
      JOIN kelas k ON k.id = a.kelas_id
      JOIN mapel m ON m.id = a.mapel_id
      ORDER BY a.tanggal DESC, a.jam_ke ASC;
  `);

  console.log('DB siap:', DB_PATH);
  db.close();
}

setupDb();
