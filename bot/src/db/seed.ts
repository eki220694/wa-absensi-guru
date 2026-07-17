import { sql } from './connection.js';

const seed = async () => {
  // Admin default
  await sql`
    INSERT INTO guru (nip, nama, no_wa, jabatan, password_hash)
    VALUES ('ADMIN001', 'Admin SMAN 6', '6281234567890', 'admin', '$2b$10$...')
    ON CONFLICT (nip) DO NOTHING
  `;

  // Guru contoh
  const guruList = [
    { nip: 'G20240001', nama: 'Budi Santoso', no_wa: '6285212345671', jabatan: 'guru' },
    { nip: 'G20240002', nama: 'Rina Wati',    no_wa: '6285212345672', jabatan: 'guru' },
  ];
  for (const g of guruList) {
    await sql`
      INSERT INTO guru (nip, nama, no_wa, jabatan)
      VALUES (${g.nip}, ${g.nama}, ${g.no_wa}, ${g.jabatan})
      ON CONFLICT (nip) DO NOTHING
    `;
  }

  // Jadwal contoh
  await sql`
    INSERT INTO jadwal (guru_id, hari, jam_ke, jam_mulai, jam_selesai, kelas, mapel, ruangan, semester, tahun_ajaran)
    VALUES (1, 1, 1, '07:00', '07:40', 'X TKJ 1', 'Pemrograman Web', 'Lab Kom 1', 'ganjil', '2025/2026')
    ON CONFLICT (guru_id, hari, jam_ke, semester, tahun_ajaran) DO NOTHING
  `;

  // Config
  await sql`
    INSERT INTO config (key, value) VALUES
    ('latitude_sekolah', '-1.1234'),
    ('longitude_sekolah', '121.1234'),
    ('radius_absen', '100'),
    ('jam_mulai', '06:30'),
    ('jam_selesai', '15:00')
    ON CONFLICT (key) DO NOTHING
  `;

  console.log('Seed selesai');
  process.exit(0);
};

seed().catch(console.error);
