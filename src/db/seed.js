import { getDb } from './setup.js';

const db = getDb();

// Data contoh SMAN 6 SIGI
const guru = [
  { id: 'G001', nama: 'Budi Santoso', no_wa: '6281234567890', nuptk: '198512345670001' },
  { id: 'G002', nama: 'Rina Wati', no_wa: '6281234567891', nuptk: '198712345670002' },
  { id: 'G003', nama: 'Ahmad Hidayat', no_wa: '6281234567892', nuptk: '199012345670003' },
];

const mapel = [
  { nama: 'Pemrograman Web' },
  { nama: 'Basis Data' },
  { nama: 'Jaringan Komputer' },
  { nama: 'Sistem Operasi' },
  { nama: 'Mulok' },
  { nama: 'PKK' },
];

const kelas = [
  { nama: 'X TKJ 1' },
  { nama: 'X TKJ 2' },
  { nama: 'XI TKJ 1' },
  { nama: 'XI TKJ 2' },
  { nama: 'XII TKJ 1' },
  { nama: 'XII TKJ 2' },
];

// Insert
const insertGuru = db.prepare('INSERT OR IGNORE INTO guru (id, nama, no_wa, nuptk) VALUES (?, ?, ?, ?)');
const insertMapel = db.prepare('INSERT OR IGNORE INTO mapel (nama) VALUES (?)');
const insertKelas = db.prepare('INSERT OR IGNORE INTO kelas (nama) VALUES (?)');
const insertJadwal = db.prepare('INSERT OR IGNORE INTO jadwal (hari, jam_ke, kelas_id, mapel_id, guru_id, jam_mulai, jam_selesai) VALUES (?, ?, ?, ?, ?, ?, ?)');
const getMapelId = db.prepare('SELECT id FROM mapel WHERE nama = ?');
const getKelasId = db.prepare('SELECT id FROM kelas WHERE nama = ?');

const runAll = db.transaction(() => {
  guru.forEach(g => insertGuru.run(g.id, g.nama, g.no_wa, g.nuptk));
  mapel.forEach(m => insertMapel.run(m.nama));
  kelas.forEach(k => insertKelas.run(k.nama));

  // Contoh jadwal: Budi ajar Pemrograman Web kelas X TKJ 1 Senin jam 1-2
  const budi = 'G001';
  const pw = getMapelId.get('Pemrograman Web').id;
  const xtkj1 = getKelasId.get('X TKJ 1').id;
  const xtkj2 = getKelasId.get('X TKJ 2').id;

  insertJadwal.run('senin', 1, xtkj1, pw, budi, '07:00', '07:40');
  insertJadwal.run('senin', 2, xtkj2, pw, budi, '07:40', '08:20');
  insertJadwal.run('selasa', 1, xtkj1, getMapelId.get('Basis Data').id, budi, '07:00', '07:40');
  insertJadwal.run('rabu', 3, xtkj1, getMapelId.get('Jaringan Komputer').id, 'G002', '08:25', '09:05');
});

runAll();
console.log('Seed selesai');
db.close();
