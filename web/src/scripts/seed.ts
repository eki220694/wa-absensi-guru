import { pool } from '../lib/db-pool.js';

const seed = async () => {
  await pool.query(
    `INSERT INTO guru (nip, nama, telegram_id, jabatan, password_hash)
     VALUES ('ADMIN001', 'Admin SMAN 6', '100000001', 'admin', '$2a$10$UT6urtKrjqT4vt.k/HK2ve6BgVw85qX/ldfqNzSkPZbcR7x/.V4Eu')
     ON CONFLICT (nip) DO NOTHING`
  );
  console.log('Admin seeded');

  const guruList = [
    { nip: 'G20240001', nama: 'Budi Santoso', telegram_id: '200000001', jabatan: 'guru' },
    { nip: 'G20240002', nama: 'Rina Wati',    telegram_id: '200000002', jabatan: 'guru' },
  ];
  for (const g of guruList) {
    await pool.query(
      `INSERT INTO guru (nip, nama, telegram_id, jabatan)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (nip) DO NOTHING`,
      [g.nip, g.nama, g.telegram_id, g.jabatan]
    );
    console.log('Guru seeded:', g.nama);
  }

  await pool.query(
    `INSERT INTO jadwal (guru_id, hari, jam_ke, jam_mulai, jam_selesai, kelas, mapel, ruangan, semester, tahun_ajaran)
     VALUES (1, 1, 1, '07:00', '07:40', 'X TKJ 1', 'Pemrograman Web', 'Lab Kom 1', 'ganjil', '2025/2026')
     ON CONFLICT (guru_id, hari, jam_ke, semester, tahun_ajaran) DO NOTHING`
  );
  console.log('Jadwal seeded');

  await pool.query(
    `INSERT INTO config (key, value) VALUES
     ('latitude_sekolah', '-1.1234'),
     ('longitude_sekolah', '121.1234'),
     ('radius_absen', '100'),
     ('jam_mulai', '06:30'),
     ('jam_selesai', '15:00')
     ON CONFLICT (key) DO NOTHING`
  );
  console.log('Config seeded');

  console.log('Seed selesai');
  await pool.end();
  process.exit(0);
};

seed().catch((e) => { console.error(e); process.exit(1); });
