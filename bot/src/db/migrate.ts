import { sql } from './connection.js';

const up = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS guru (
      id SERIAL PRIMARY KEY,
      nip TEXT UNIQUE NOT NULL,
      nama TEXT NOT NULL,
      no_wa TEXT UNIQUE NOT NULL,
      jabatan TEXT NOT NULL DEFAULT 'guru',
      password_hash TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS jadwal (
      id SERIAL PRIMARY KEY,
      guru_id INT REFERENCES guru(id),
      hari SMALLINT NOT NULL CHECK(hari BETWEEN 1 AND 6),
      jam_ke SMALLINT NOT NULL CHECK(jam_ke BETWEEN 1 AND 10),
      jam_mulai TIME NOT NULL,
      jam_selesai TIME NOT NULL,
      kelas TEXT NOT NULL,
      mapel TEXT NOT NULL,
      ruangan TEXT,
      semester TEXT NOT NULL,
      tahun_ajaran TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(guru_id, hari, jam_ke, semester, tahun_ajaran)
    );

    CREATE TABLE IF NOT EXISTS absen (
      id SERIAL PRIMARY KEY,
      guru_id INT REFERENCES guru(id),
      jadwal_id INT REFERENCES jadwal(id),
      tanggal DATE NOT NULL,
      jam_ke SMALLINT NOT NULL,
      status TEXT NOT NULL DEFAULT 'hadir' CHECK(status IN ('hadir','terlambat','tidak_hadir')),
      di_luar_radius BOOLEAN DEFAULT FALSE,
      jarak_meter REAL,
      latitude REAL,
      longitude REAL,
      foto_path TEXT,
      foto_valid BOOLEAN DEFAULT FALSE,
      keterangan TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(guru_id, jadwal_id, tanggal)
    );

    CREATE TABLE IF NOT EXISTS izin (
      id SERIAL PRIMARY KEY,
      guru_id INT REFERENCES guru(id),
      jenis TEXT NOT NULL CHECK(jenis IN ('izin','sakit','cuti','dinas_luar')),
      tanggal_mulai DATE NOT NULL,
      tanggal_selesai DATE NOT NULL,
      jam_ke_awal SMALLINT,
      jam_ke_akhir SMALLINT,
      alasan TEXT,
      bukti_path TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','disetujui','ditolak')),
      approved_by INT REFERENCES guru(id),
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_absen_tanggal ON absen(tanggal);
    CREATE INDEX IF NOT EXISTS idx_absen_guru_tanggal ON absen(guru_id, tanggal);
    CREATE INDEX IF NOT EXISTS idx_jadwal_hari ON jadwal(hari);
    CREATE INDEX IF NOT EXISTS idx_izin_status ON izin(status);
  `;

  console.log('Migrasi selesai');
  process.exit(0);
};

up().catch(console.error);
