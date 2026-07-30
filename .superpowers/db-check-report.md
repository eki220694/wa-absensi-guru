# DB Schema + Seed Check Report

**Date:** 2026-07-30
**DB:** Neon (ep-super-hill-aznv9tsm-pooler.c-3.ap-southeast-1.aws.neon.tech)

---

## 1. `guru` Table Schema

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | integer | NO | nextval('guru_id_seq') | PK |
| nip | text | NO | | UNIQUE |
| nama | text | NO | | |
| no_wa | text | YES | | UNIQUE |
| jabatan | text | NO | 'guru' | |
| password_hash | text | YES | | |
| created_at | timestamptz | YES | now() | |
| **telegram_id** | **text** | **YES** | | **UNIQUE** |

**telegram_id assessment:**
- Type: **TEXT** (not BIGINT/INTEGER as requested)
- UNIQUE: ✓ YES
- Nullable: ✓ YES
- **Note:** TEXT is actually **safer** for Telegram IDs — JS Number loses precision beyond 2^53 (~9e15), while Telegram IDs fit in 64-bit. TEXT accepts any string representation without casting issues.

---

## 2. `guru` Seed Data

| id | nip | nama | telegram_id | has_password |
|----|-----|------|-------------|--------------|
| 1 | ADMIN001 | Admin SMAN 6 | **1116369238** | ✓ YES |
| 2 | 199406222022211001 | Rezky Hari Sentosa | (NULL) | ✗ NO |
| 3 | G20240002 | Rina Wati | (NULL) | ✗ NO |

**Issues:**
- **G20240001 (Budi Santoso) MISSING** — not in seed data
- Admin has telegram_id pre-filled (should be NULL or real admin ID)
- Non-admin guru lack password_hash (need bcrypt seed)

---

## 3. `bot_session` Table

**Before cleanup:** 1 stale session (chat_id=1116369238, step=await_izin_tgl_mulai, guruId=1)
**Action taken:** `DELETE FROM bot_session` ✓
**After cleanup:** 0 rows ✓

---

## 4. `config` Table

| key | value |
|-----|-------|
| jam_mulai | 07:15 |
| jam_selesai | 15:00 |
| latitude_sekolah | -1.1234 |
| longitude_sekolah | 121.1234 |
| radius_absen | 100 |

All required config present ✓

---

## 5. Other Tables (schema only)

### `jadwal`
- PK id, FK guru_id → guru(id)
- UNIQUE (guru_id, hari, jam_ke, semester, tahun_ajaran)
- CHECK hari 1-6, jam_ke 1-10 ✓

### `absen`
- PK id, FK guru_id, FK jadwal_id
- UNIQUE (guru_id, jadwal_id, tanggal)
- CHECK status IN ('hadir','terlambat','tidak_hadir') ✓

### `izin` (referenced by guru FKs)
- Not queried but foreign keys exist ✓

---

## 6. Summary & Action Items

| Item | Status | Action Needed |
|------|--------|---------------|
| telegram_id type | TEXT (acceptable) | No change needed — TEXT safer for JS |
| telegram_id UNIQUE | ✓ | OK |
| telegram_id nullable | ✓ | OK |
| Admin telegram_id | Pre-filled | Set NULL if not real admin ID |
| G20240001 Budi Santoso | **MISSING** | Add seed with bcrypt password |
| Non-admin password_hash | Missing | Add bcrypt seeds for Rezky, Rina |
| bot_session stale | ✓ Cleaned | Done |
| config complete | ✓ | OK |

---

## Recommended Seed Fix

```sql
-- Add missing Budi Santoso
INSERT INTO guru (nip, nama, jabatan, password_hash, no_wa)
VALUES ('G20240001', 'Budi Santoso', 'guru', '$2b$10$...', '628xxxxxxxxx')
ON CONFLICT (nip) DO NOTHING;

-- Add passwords for existing guru
UPDATE guru SET password_hash = '$2b$10$...' WHERE nip IN ('199406222022211001', 'G20240002');

-- Clear admin telegram_id if not real
UPDATE guru SET telegram_id = NULL WHERE nip = 'ADMIN001';
```

(Use bcrypt hash for `password123` or similar default)