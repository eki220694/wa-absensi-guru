# 📱 Panduan Absensi Guru — SMAN 6 SIGI

Sistem absensi via **WhatsApp Bot** (@sman6sigi_absen_bot). Semua guru terdaftar otomatis oleh admin — cukup daftar sekali, lalu absen dari HP.

---

## 1️⃣ Pendaftaran (sekali saja)

1. Buka Telegram, cari bot: **@sman6sigi_absen_bot**
2. Tekan **START**
3. Ketik perintah daftar:

```
/daftar NIP password
```

Contoh:
```
/daftar 199406222022211001 guru123
```

- **NIP**: 18 digit sesuai Dapodik (guru honorer: `H-ANNISA`, `H-IBRAHIM`, `H-IVANA`)
- **Password awal**: `guru123` (semua guru)
- Berhasil → balasan `✅ Berhasil terdaftar!` lalu ketik `/start`
- ⚠️ Daftar hanya **1 HP**. Kalau ganti HP, daftar ulang dari HP baru (otomatis pindah).

## 2️⃣ Menu utama

Ketik `/start` → muncul 5 tombol:

| Tombol | Fungsi |
|---|---|
| ✅ Absen | Absen jam pelajaran yang sedang dekat |
| 📋 Jadwal | Lihat jadwal hari ini |
| 🏖 Izin | Ajukan Sakit / Izin / Cuti / Dinas |
| 📊 Cek Absen | Lihat riwayat absen hari ini |
| ❓ Bantuan | Daftar perintah |

## 3️⃣ Absen harian

Alur:

1. Tekan **✅ Absen** (atau `/absen`)
2. Bot tampilkan **tombol jam yang sudah boleh di-absen** — pilih
3. Kirim **lokasi**: tekan 📎 → **Location** → kirim
4. Kirim **foto** (kelas/selfie) — atau ketik `/skip` kalau mau lewati
5. Selesai → `✅ Foto tersimpan. Absen selesai!`

Aturan penting:

- **Jendela absen**: 15 menit sebelum jam mulai s/d 30 menit setelah jam selesai.
  - Contoh jam pelajaran 08:00–08:45 → boleh absen **07:45–09:15**
- **Di luar jendela** → bot jawab *"Belum waktunya absen."* (daftar jadwal hari ini tetap tampil, yang sudah diabsen bertanda ✅)
- **Lokasi wajib di dalam radius 100 m** dari sekolah. Di luar radius → tetap tercatat tapi ditandai
- **Minggu libur** — bot tolak dengan *"📅 Minggu — libur."*
- **Absein ganda ditolak** → *"✅ Sudah absen."*
- Punya 2 kelas di jam sama? Absen tiap kelas (tombol jam muncul 2x) — keduanya juga boleh absenkan.

## 4️⃣ Cek absen

```
/cek
```
Menampilkan ringkasan absen hari ini: status ✅ hadir / ⚠️ terlambat / ❌ tidak hadir per jam pelajaran.

## 5️⃣ Izin (Sakit / Izin / Cuti / Dinas)

Alur:

1. Ketik `/izin` (atau tombol 🏖 Izin)
2. Pilih jenis tombol: **🩺 Sakit · 🏖 Izin · ✈️ Cuti · 🏢 Dinas**
3. Ketik tanggal mulai: `DD/MM/YYYY` contoh `12/08/2026`
4. Ketik tanggal selesai (sama, kalau 1 hari)
5. Ketik alasan (bebas, mis. "Demam, surat dokter menyusul")
6. Kirim **foto bukti** (surat dokter/dll) — atau `/skip` kalau tidak ada
7. Selesai → `✅ Izin terkirim ... ⏳ Menunggu admin.`

- Status izin: **Menunggu admin** → admin setujui/tolak lewat web admin
- Izin tercatat untuk rentang tanggal yang diajukan — tidak perlu absen manual di hari itu

## 6️⃣ Notifikasi belum absen

Tidak perlu membuka Telegram terus-menerus. Bot **mengirim notifikasi otomatis** ke HP setiap 30 menit (Senin–Sabtu, 08:00–15:30 WITA) selama jam pelajaran belum diabsen.

Contoh notif:

```
⏰ Reminder Absen
Jam ke-2: Koding — X-D

Ketik /absen untuk absen sekarang.
```

Syarat notif sampai:
- Sudah `/daftar` sekali (bot menyimpan chat ID)
- Notifikasi Telegram aktif di HP
- Chat dengan bot TIDAK di-mute (pesan tetap masuk tapi tanpa bunyi kalau di-mute)
- Guru yang sudah absen / sudah izin (disetujui atau menunggu admin) TIDAK akan di-remind

## 7️⃣ Perintah cepat


| Perintah | Fungsi |
|---|---|
| `/start` | Menu utama |
| `/daftar NIP password` | Daftar / pindah HP |
| `/absen` | Mulai absen |
| `/jadwal` | Jadwal hari ini (Senin–Jumat) |
| `/cek` | Riwayat absen hari ini |
| `/izin` | Ajukan izin |
| `/help` | Bantuan |

## 8️⃣ Troubleshooting

| Masalah | Solusi |
|---|---|
| `❌ NIP tidak ditemukan.` | Cek NIP (18 digit / `H-*`), tanya admin kalau ragu |
| `❌ Belum punya password. Hubungi admin.` | Password belum dibuat — hubungi admin web |
| `❌ Password salah.` | Ketik ulang `/daftar NIP guru123` |
| `❌ Belum terdaftar.` | Jalankan `/daftar` dulu |
| `Belum waktunya absen.` | Jendela buka 15 mnt sebelum jam mulai — tunggu, ulangi |
| `⏳ Terlalu cepat.` | Max 5 pesan/menit — tunggu sebentar |
| Lokasi tidak terkirim | Pastikan GPS HP aktif; Telegram minta izin lokasi |
| Ganti HP / hilang chat | Buka bot lagi → START → `/daftar NIP password` lagi |

---

*Ada masalah lain? Hubungi admin (Rezky).*
