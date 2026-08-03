# Design Spec: Excel Import/Export Guru & Jadwal

**Date:** 2026-08-03
**Author:** Pi (AI) + Eki (user)
**Status:** Draft — awaiting user review

---

## Goal

Admin bisa download template Excel (.xlsx) berisi data guru & jadwal dari DB, edit offline, lalu upload batch ke DB via Excel tanpa input manual satu per satu.

---

## Scope

- Export: download data guru & jadwal dari DB ke file Excel (.xlsx)
- Import: upload file Excel (.xlsx) ke DB — upsert (insert new, update existing)
- Dependency: ExcelJS (sudah ada di `package.json` web workspace)
- No new dependencies needed

---

## API Design

### 1. GET `/api/export/guru-template`

**Response:** `.xlsx` file

**Sheet columns:**
| Kolom | Wajib | Catatan |
|-------|-------|---------|
| NIP | ✅ | Unique key, wajib isi |
| Nama | ✅ | |
| No. HP / Telegram | - | Boleh kosong |
| Jabatan | - | Default `guru`. Pilihan: guru, wali_kelas, admin |

- Header row = bold, freeze panes row 1
- Data rows = semua guru dari DB, urut by nama
- Filename: `template-guru.xlsx`

### 2. POST `/api/import/guru`

**Request:** `multipart/form-data`, field `file` = .xlsx file

**Per-row processing:**
1. Baca row 2 ke bawah (skip header row 1)
2. Validasi: NIP wajib, Nama wajib → kalau kosong, skip row + push error
3. Upsert: `INSERT INTO guru (nip, nama, no_wa, jabatan) VALUES (...) ON CONFLICT (nip) DO UPDATE SET nama=EXCLUDED.nama, no_wa=EXCLUDED.no_wa, jabatan=EXCLUDED.jabatan`
   - `password_hash` tidak disentuh (tidak ada di import)
   - `jabatan` default `guru` jika kosong

**Response:**
```json
{
  "inserted": 3,
  "updated": 1,
  "errors": [
    { "row": 5, "nip": "?", "error": "NIP kosong" },
    { "row": 8, "nip": "X", "error": "Nama kosong" }
  ]
}
```

### 3. GET `/api/export/jadwal-template`

**Response:** `.xlsx` file

**Sheet columns:**
| Kolom | Wajib | Catatan |
|-------|-------|---------|
| NIP Guru | ✅ | Dipakai sebagai referensi, lookup ke guru_id |
| Hari | ✅ | 1=Senin ... 6=Sabtu |
| Jam Ke | ✅ | 1-10 |
| Jam Mulai | ✅ | Format HH:MM (contoh: 07:00) |
| Jam Selesai | ✅ | Format HH:MM (contoh: 08:40) |
| Kelas | ✅ | Contoh: X TKJ 1 |
| Mapel | ✅ | Contoh: Pemrograman Web |
| Ruangan | - | Boleh kosong |
| Semester | ✅ | ganjil/genap |
| Tahun Ajaran | ✅ | Contoh: 2025/2026 |

- Header row = bold, freeze panes row 1
- Data rows = semua jadwal dari DB, JOIN ke guru tabel untuk tampilkan NIP (bukan guru_id)
- Filename: `template-jadwal.xlsx`

### 4. POST `/api/import/jadwal`

**Request:** `multipart/form-data`, field `file` = .xlsx file

**Per-row processing:**
1. Baca row 2 ke bawah
2. Validasi: NIP wajib → lookup guru_id (kalau tidak ditemukan, error)
3. Validasi: Hari 1-6, Jam Ke 1-10, format jam HH:MM, Kelas/Mapel/Semester/Tahun Ajaran wajib
4. Upsert: `INSERT INTO jadwal (guru_id, hari, jam_ke, jam_mulai, jam_selesai, kelas, mapel, ruangan, semester, tahun_ajaran) VALUES (...) ON CONFLICT (guru_id, hari, jam_ke, semester, tahun_ajaran) DO UPDATE SET jam_mulai=EXCLUDED.jam_mulai, jam_selesai=EXCLUDED.jam_selesai, kelas=EXCLUDED.kelas, mapel=EXCLUDED.mapel, ruangan=EXCLUDED.ruangan`

**Response:**
```json
{
  "inserted": 5,
  "updated": 2,
  "errors": [
    { "row": 3, "error": "NIP X tidak ditemukan di DB" },
    { "row": 7, "error": "Hari harus 1-6, dapat 7" }
  ]
}
```

---

## UI Changes

### Halaman `/guru` (`web/src/app/guru/page.tsx`)

Di samping tombol "+ Tambah", tambah dua tombol:

```tsx
<a href="/api/export/guru-template" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
  Download Template
</a>
<input type="file" accept=".xlsx" onChange={handleImportGuru} className="hidden" ref={fileRef} />
<button onClick={() => fileRef.current?.click()} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
  Import Excel
</button>
```

- Setelah import, tampilkan ringkasan: "✅ 3 baru, 1 diupdate. ❌ 2 error (lihat detail)"
- Error detail: tampilkan row + pesan error

### Halaman `/jadwal` (`web/src/app/jadwal/page.tsx`)

Pola sama: tombol "Download Template" + "Import Excel".

---

## Validation Rules

### Guru Import

| Field | Rule |
|-------|------|
| NIP | Wajib, string non-kosong |
| Nama | Wajib, string non-kosong |
| No. HP | Opsional, string atau kosong |
| Jabatan | Default `guru`. Pilihan: guru, wali_kelas, admin |

### Jadwal Import

| Field | Rule |
|-------|------|
| NIP Guru | Wajib, harus ada di tabel `guru` |
| Hari | Wajib, integer 1-6 |
| Jam Ke | Wajib, integer 1-10 |
| Jam Mulai | Wajib, format HH:MM |
| Jam Selesai | Wajib, format HH:MM |
| Kelas | Wajib, string non-kosong |
| Mapel | Wajib, string non-kosong |
| Ruangan | Opsional |
| Semester | Wajib: `ganjil` atau `genap` |
| Tahun Ajaran | Wajib, format: `YYYY/YYYY` (contoh: `2025/2026`) |

---

## File Structure (new files)

```
web/src/app/api/export/guru-template/route.ts   — GET
web/src/app/api/import/guru/route.ts             — POST
web/src/app/api/export/jadwal-template/route.ts  — GET
web/src/app/api/import/jadwal/route.ts           — POST
```

- Semua endpoint pakai `getServerSession` (auth required)
- Semua pakai `ExcelJS` untuk baca/tulis .xlsx
- Pattern: konsisten dengan `api/export/excel/route.ts` yang sudah ada

---

## Error Handling

- Import route: try/catch global + per-row error capture
- Kalau file bukan .xlsx → return 400 `{ error: "File harus .xlsx" }`
- Kalau sheet kosong/tidak ada data row → return 400 `{ error: "Sheet kosong" }`
- Per-row error: push ke array, lanjut row berikutnya, jangan throw

---

## Open Items

- Semester default saat import: `ganjil` atau harus wajib isi?
- Tahun ajaran default: `2025/2026` atau harus wajib isi?
- Kolom "No. HP / Telegram" di export guru: kosongkan karena admin tidak perlu isi (Telegram di-handle bot)

**Pilihan:** Semester & Tahun Ajaran wajib isi (admin harus tentukan sendiri saat upload)
