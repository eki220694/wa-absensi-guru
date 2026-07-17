# WA Absensi Guru — Design Spec

**Tanggal:** 2026-07-17  
**Sekolah:** SMAN 6 SIGI  
**Status:** DRAFT

---

## Ringkasan

Sistem absensi guru mengajar berbasis WhatsApp chatbot dengan dashboard admin web.

**Flow inti:** Guru ketik `/absen` → pilih jadwal mengajar → kirim GPS + foto kelas → bot simpan → admin cek di dashboard web.

**Scale:** 60 guru, ~200 absen/hari.

---

## Fitur Utama

### 1. Absen Per Jam Mengajar (Manual Trigger)

- Guru ketik `/absen`
- Bot query jadwal guru untuk hari ini (±15 menit jam sekarang)
- Guru pilih jadwal dari list → kirim GPS → kirim foto kelas
- GPS: soft validation (flag di_luar_radius, tetap simpan)
- Foto: template matching (Tesseract.js OCR) cek nama kelas di foto
- Simpan absen + notifikasi ke admin di dashboard

### 2. Izin / Sakit / Cuti / Dinas Luar

- Guru ketik `/izin` → pilih jenis → isi tanggal + alasan → kirim bukti
- Admin approve/reject di dashboard web
- Absen jadwal tertimpa otomatis diisi status izin

### 3. Dashboard Admin Web

- Overview: total guru, absen hari ini, izin pending, grafik kehadiran
- CRUD Guru (import Excel)
- CRUD Jadwal Mengajar (import Excel)
- Tabel Absen (filter: guru/kelas/tanggal)
- Daftar Izin (approve/reject)
- Export Excel/PDF rekap bulanan per guru atau per kelas
- Pengaturan: GPS sekolah, radius, jam sekolah

### 4. Export

- Rekap bulanan per guru (Excel/PDF)
- Rekap per kelas (Excel/PDF)
- Rekap per minggu (Excel)
- Format: nama, NIP, jadwal, hadir, izin, sakit, tanpa keterangan

---

## Arsitektur

### Monorepo

```
wa-absensi-guru/
├── package.json            # workspaces: ["packages/*", "shared"]
├── packages/
│   ├── bot/                # WA bot (Baileys + Tesseract.js)
│   └── web/                # Admin dashboard (Next.js 14)
├── shared/                 # Types, constants, utils
└── docs/                   # Spec ini
```

### Tech Stack

| Layer | Teknologi |
|-------|-----------|
| WhatsApp | Baileys v6 |
| Bot Server | Node.js + Express ( Railway ) |
| Web Dashboard | Next.js 14 App Router (Vercel) |
| Database | PostgreSQL (Neon free tier) |
| Auth (WA) | Cek nomor di tabel guru |
| Auth (Web) | NextAuth credentials (NIP + password) |
| OCR | Tesseract.js |
| GPS | Haversine formula, radius default 100m |
| Export | exceljs (Excel), pdfkit (PDF) |

### Database (PostgreSQL)

```sql
CREATE TABLE guru (
  id SERIAL PRIMARY KEY,
  nip TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  no_wa TEXT UNIQUE NOT NULL,
  jabatan TEXT DEFAULT 'guru',
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jadwal (
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

CREATE TABLE absen (
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

CREATE TABLE izin (
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

CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Index untuk query performa
CREATE INDEX idx_absen_tanggal ON absen(tanggal);
CREATE INDEX idx_absen_guru_tanggal ON absen(guru_id, tanggal);
CREATE INDEX idx_jadwal_hari ON jadwal(hari);
CREATE INDEX idx_izin_status ON izin(status);
```

---

## Alur Bot WhatsApp

### Alur Absen

```
/guru → /absen
  │
  ├─ Query jadwal WHERE guru_id = :guru AND hari = hari_sekarang
  │   AND jam_ke BETWEEN (jam_sekarang - 1) AND (jam_sekarang + 1)
  │
  ├─ Tidak ada → "Tidak ada jadwal mengajar saat ini."
  │
  └─ Ada → List jadwal:
      1. Pemrograman Web - X TKJ 1 - Jam 1 (07:00-07:40) - Lab Kom 1
      2. Basis Data - XI TKJ 2 - Jam 3 (08:25-09:05) - Lab Kom 2
      Ketik nomor untuk pilih.

  Guru: 1
  │
  ├─ Bot: "Kirim lokasi GPS"
  │
  ├─ Guru: [kirim location]
  │   ├─ Hitung jarak ke titik sekolah (Haversine)
  │   ├─ Jarak ≤ 100m → OK
  │   └─ Jarak > 100m → Flag di_luar_radius, tetap lanjut
  │
  ├─ Bot: "Kirim foto kelas (harus terlihat nama kelas)"
  │
  ├─ Guru: [kirim foto]
  │   ├─ Simpan foto ke /data/photos/:guru_id/:tanggal_:jam_ke.jpg
  │   ├─ Tesseract OCR → cari teks nama kelas
  │   ├─ Cocok → foto_valid = true
  │   └─ Tidak cocok → foto_valid = false
  │
  └─ Bot: Simpan absen → Konfirmasi:
      ✅ Absen tercatat
      📅 17 Juli 2026, Jam 1 (07:00-07:40)
      👨‍🏫 Budi Santoso
      📚 Pemrograman Web
      🏫 X TKJ 1 - Lab Kom 1
      📍 15.2m dari sekolah ✅
      📸 Foto valid ✅
```

### Alur Izin

```
/guru → /izin
  │
  ├─ Pilih jenis: [1] Izin [2] Sakit [3] Cuti [4] Dinas Luar
  │
  ├─ Guru: 1
  │
  ├─ Bot: "Tanggal mulai? (DD/MM/YYYY)"
  │
  ├─ Guru: 17/07/2026
  │
  ├─ Bot: "Tanggal selesai? (DD/MM/YYYY)"
  │
  ├─ Guru: 18/07/2026
  │
  ├─ Bot: "Alasan singkat?"
  │
  ├─ Guru: Urusan keluarga
  │
  ├─ Bot: "Kirim bukti (foto surat/screenshot) atau ketik /skip"
  │
  ├─ Guru: [kirim foto] atau /skip
  │
  └─ Bot: ✅ Pengajuan izin terkirim. Menunggu persetujuan admin.
      📅 17-18 Juli 2026
      📋 Izin
      💬 Urusan keluarga
```

---

## Dashboard Admin Web (Next.js 14)

### Halaman

| Route | Fungsi |
|-------|--------|
| `/` | Overview: jumlah guru, absen hari ini, izin pending, grafik mingguan |
| `/guru` | Tabel guru, CRUD, import Excel |
| `/guru/[id]` | Detail guru + rekap bulanan + riwayat |
| `/absen` | Filter: guru/kelas/tanggal, tabel absen, export |
| `/absen/export` | Form pilih rentang → download Excel/PDF |
| `/izin` | Tabel izin pending, approve/reject |
| `/jadwal` | CRUD jadwal per semester, import Excel |
| `/pengaturan` | GPS koordinat, radius (meter), jam sekolah |

### Komponen

- **Layout:** Sidebar navigation, header user info
- **Table:** Sort, filter, pagination
- **Form:** Zod validation
- **Charts:** Recharts (grafik kehadiran mingguan/bulanan)
- **Export:** Server action generate Excel/PDF → download link

### Auth

- NextAuth credentials provider
- Login: NIP + password
- Role: admin only (user 1 di tabel guru = admin)
- Session: JWT

---

## Shared Package

### Types

```typescript
interface Guru {
  id: number;
  nip: string;
  nama: string;
  no_wa: string;
  jabatan: 'guru' | 'wali_kelas' | 'admin';
}

interface Jadwal {
  id: number;
  guru_id: number;
  hari: number;      // 1=Senin
  jam_ke: number;
  jam_mulai: string;  // '07:00'
  jam_selesai: string;
  kelas: string;
  mapel: string;
  ruangan: string;
}

interface Absen {
  id: number;
  guru_id: number;
  jadwal_id: number;
  tanggal: string;    // 'YYYY-MM-DD'
  jam_ke: number;
  status: 'hadir' | 'terlambat' | 'tidak_hadir';
  di_luar_radius: boolean;
  jarak_meter: number;
  latitude: number;
  longitude: number;
  foto_path: string;
  foto_valid: boolean;
}

interface Izin {
  id: number;
  guru_id: number;
  jenis: 'izin' | 'sakit' | 'cuti' | 'dinas_luar';
  tanggal_mulai: string;
  tanggal_selesai: string;
  alasan: string;
  bukti_path: string;
  status: 'pending' | 'disetujui' | 'ditolak';
}
```

### Constants

```typescript
const SEKOLAH = {
  nama: 'SMAN 6 SIGI',
  latitude: -1.1234,    // koordinat sebenarnya
  longitude: 121.1234,
};

const RADIUS_METER = 100;
const JAM_SEKOLAH = {
  mulai: '06:30',
  selesai: '15:00',
};
const HARI = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
```

### Utils

- `hitungJarak(lat1, lng1, lat2, lng2)` → meter (Haversine)
- `formatTanggal(date, locale='id-ID')` → '17 Juli 2026'
- `generateExcel(data, filename)` → Buffer
- `generatePDF(data, filename)` → Buffer
- `validasiOCR(fotoPath, templateText)` → boolean

---

## Deployment

| Service | Platform | Command | Notes |
|---------|----------|---------|-------|
| WA Bot | Railway | `npm run bot:start` | Persistent volume untuk foto |
| Dashboard | Vercel | `npm run web:build` | Edge runtime |
| Database | Neon | PostgreSQL | Free tier |

### Railway Volume

- `/data` → foto absen (persistent)
- File foto: `/data/photos/:guru_id/:YYYY-MM-DD_:jam_ke.jpg`

### Cron/Job

- **Tidak ada** — Bot event-driven (WA message masuk → handle)
- **Opsional:** Reminder jam 7 pagi (cron node-cron di bot) untuk guru yang belum absen

---

## Keamanan

- Nomor WA harus terdaftar di tabel `guru` untuk pakai bot
- Admin commands (`/admin*`) hanya dari nomor admin
- Rate limit: max 5 request/menit per nomor
- Web auth: NIP + bcrypt password
- Session expiry: 24 jam
- API routes: protected by NextAuth session
- Database: Neon connection pool, SSL required

---

## Risks & Mitigations

| Risks | Mitigation |
|-------|------------|
| Baileys disconnected | Auto-reconnect + session save |
| Foto tidak terbaca OCR | Threshold 60% karakter + admin review di dashboard |
| Guru kirim foto palsu | Admin bisa lihat foto + jarak + waktu di dashboard |
| GPS spoofing | Flag di_luar_radius + admin review |
| Neon free tier sleep | Keep-alive ping atau upgrade ke paid |

---

## Out of Scope (MVP)

- Real-time notification ke admin via WA (cukup dashboard)
- Auto-reminder ke guru per jam (opsional, bisa tambah nanti)
- Integrasi dengan e-Rapor / SIM
- Multi-sekolah
- Mobile app native
