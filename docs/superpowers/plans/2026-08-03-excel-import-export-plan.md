# Excel Import/Export Guru & Jadwal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin dapat download template Excel guru & jadwal, edit offline, lalu upload batch ke DB (upsert, error per-row).

**Architecture:** 4 API routes (2 export GET, 2 import POST) + 2 UI pages with Download/Import buttons. ExcelJS (existing dep) untuk baca/tulis .xlsx.

**Tech Stack:** Next.js 14 API routes, ExcelJS, `multipart/form-data` via `request.formData()`, `getServerSession` auth.

## Global Constraints

- Export format: `.xlsx` (ExcelJS)
- Import format: `.xlsx` only
- Auth required: `getServerSession` on all endpoints
- Upsert behavior: insert new, update existing (ON CONFLICT DO UPDATE)
- Password_hash: **never touched** by import/export
- Jadwal import references guru by NIP (lookup → guru_id)
- Error handling: per-row errors collected, valid rows still processed
- No new npm dependencies

---

### Task 1: GET `/api/export/guru-template` — Download template guru

**Files:**
- Create: `web/src/app/api/export/guru-template/route.ts`

**Interfaces:**
- Consumes: `getServerSession` (next-auth), `sql` (Neon), `ExcelJS`
- Produces: `NextResponse` with `.xlsx` buffer, `Content-Disposition: attachment`

- [ ] **Step 1: Create export guru template endpoint**

```typescript
// web/src/app/api/export/guru-template/route.ts
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import ExcelJS from 'exceljs';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`SELECT nip, nama, no_wa, jabatan FROM guru ORDER BY nama`;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Guru');

  ws.columns = [
    { header: 'NIP', key: 'nip', width: 18 },
    { header: 'Nama', key: 'nama', width: 25 },
    { header: 'No. HP / Telegram', key: 'no_wa', width: 20 },
    { header: 'Jabatan', key: 'jabatan', width: 15 },
  ];
  ws.getRow(1).font = { bold: true };

  for (const r of rows as any[]) {
    ws.addRow({
      nip: String(r.nip),
      nama: String(r.nama),
      no_wa: r.no_wa ? String(r.no_wa) : '',
      jabatan: String(r.jabatan || 'guru'),
    });
  }

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template-guru.xlsx"',
    },
  });
}
```

- [ ] **Step 2: Verify build passes**

Run: `npx tsc --noEmit -p web/tsconfig.json`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add web/src/app/api/export/guru-template/route.ts
git commit -m "feat: export guru template xlsx endpoint"
```

---

### Task 2: GET `/api/export/jadwal-template` — Download template jadwal

**Files:**
- Create: `web/src/app/api/export/jadwal-template/route.ts`

**Interfaces:**
- Consumes: `getServerSession`, `sql`, `ExcelJS`
- Produces: `NextResponse` with `.xlsx` buffer

- [ ] **Step 1: Create export jadwal template endpoint**

```typescript
// web/src/app/api/export/jadwal-template/route.ts
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import ExcelJS from 'exceljs';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`
    SELECT j.*, g.nip as guru_nip
    FROM jadwal j
    JOIN guru g ON g.id = j.guru_id
    ORDER BY g.nip, j.hari, j.jam_ke
  `;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Jadwal');

  ws.columns = [
    { header: 'NIP Guru', key: 'nip', width: 18 },
    { header: 'Hari', key: 'hari', width: 8 },
    { header: 'Jam Ke', key: 'jam_ke', width: 8 },
    { header: 'Jam Mulai', key: 'jam_mulai', width: 12 },
    { header: 'Jam Selesai', key: 'jam_selesai', width: 12 },
    { header: 'Kelas', key: 'kelas', width: 15 },
    { header: 'Mapel', key: 'mapel', width: 20 },
    { header: 'Ruangan', key: 'ruangan', width: 15 },
    { header: 'Semester', key: 'semester', width: 10 },
    { header: 'Tahun Ajaran', key: 'tahun_ajaran', width: 15 },
  ];
  ws.getRow(1).font = { bold: true };

  for (const r of rows as any[]) {
    ws.addRow({
      nip: String(r.guru_nip),
      hari: Number(r.hari),
      jam_ke: Number(r.jam_ke),
      jam_mulai: String(r.jam_mulai),
      jam_selesai: String(r.jam_selesai),
      kelas: String(r.kelas),
      mapel: String(r.mapel),
      ruangan: r.ruangan ? String(r.ruangan) : '',
      semester: String(r.semester),
      tahun_ajaran: String(r.tahun_ajaran),
    });
  }

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template-jadwal.xlsx"',
    },
  });
}
```

- [ ] **Step 2: Verify build passes**

Run: `npx tsc --noEmit -p web/tsconfig.json`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add web/src/app/api/export/jadwal-template/route.ts
git commit -m "feat: export jadwal template xlsx endpoint"
```

---

### Task 3: POST `/api/import/guru` — Upload guru Excel

**Files:**
- Create: `web/src/app/api/import/guru/route.ts`

**Interfaces:**
- Consumes: `getServerSession`, `sql`, `ExcelJS`, `request.formData()`
- Produces: `NextResponse.json({ inserted, updated, errors })`

- [ ] **Step 1: Create import guru endpoint**

```typescript
// web/src/app/api/import/guru/route.ts
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import ExcelJS from 'exceljs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'File wajib' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const ws = wb.worksheets[0];
  if (!ws) return NextResponse.json({ error: 'Sheet kosong' }, { status: 400 });

  let inserted = 0;
  let updated = 0;
  const errors: { row: number; nip: string; error: string }[] = [];

  for (let i = 2; i <= ws.rowCount; i++) {
    const row = ws.getRow(i);
    const nip = String(row.getCell(1).value || '').trim();
    const nama = String(row.getCell(2).value || '').trim();
    const no_wa = row.getCell(3).value ? String(row.getCell(3).value).trim() : undefined;
    const jabatan = String(row.getCell(4).value || 'guru').trim();

    if (!nip) { errors.push({ row: i, nip: '', error: 'NIP kosong' }); continue; }
    if (!nama) { errors.push({ row: i, nip, error: 'Nama kosong' }); continue; }

    try {
      const result = await sql`
        INSERT INTO guru (nip, nama, no_wa, jabatan)
        VALUES (${nip}, ${nama}, ${no_wa || null}, ${jabatan})
        ON CONFLICT (nip) DO UPDATE SET
          nama = EXCLUDED.nama,
          no_wa = EXCLUDED.no_wa,
          jabatan = EXCLUDED.jabatan
        RETURNING CASE WHEN xmax = 0 THEN 'insert' ELSE 'update' END AS action
      `;
      if (result[0]?.action === 'insert') inserted++;
      else updated++;
    } catch (e: any) {
      errors.push({ row: i, nip, error: e.message });
    }
  }

  return NextResponse.json({ inserted, updated, errors });
}
```

- [ ] **Step 2: Verify build passes**

Run: `npx tsc --noEmit -p web/tsconfig.json`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add web/src/app/api/import/guru/route.ts
git commit -m "feat: import guru xlsx endpoint"
```

---

### Task 4: POST `/api/import/jadwal` — Upload jadwal Excel

**Files:**
- Create: `web/src/app/api/import/jadwal/route.ts`

**Interfaces:**
- Consumes: `getServerSession`, `sql`, `ExcelJS`, `request.formData()`
- Produces: `NextResponse.json({ inserted, updated, errors })`

- [ ] **Step 1: Create import jadwal endpoint**

```typescript
// web/src/app/api/import/jadwal/route.ts
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import ExcelJS from 'exceljs';

function parseJam(value: any): string | null {
  if (!value) return null;
  const s = String(value).trim();
  if (!/^\d{1,2}:\d{2}$/.test(s)) return null;
  return s;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'File wajib' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const ws = wb.worksheets[0];
  if (!ws) return NextResponse.json({ error: 'Sheet kosong' }, { status: 400 });

  let inserted = 0;
  let updated = 0;
  const errors: { row: number; error: string }[] = [];

  for (let i = 2; i <= ws.rowCount; i++) {
    const row = ws.getRow(i);
    const nip = String(row.getCell(1).value || '').trim();
    const hariRaw = row.getCell(2).value;
    const jamKeRaw = row.getCell(3).value;
    const jamMulai = parseJam(row.getCell(4).value);
    const jamSelesai = parseJam(row.getCell(5).value);
    const kelas = String(row.getCell(6).value || '').trim();
    const mapel = String(row.getCell(7).value || '').trim();
    const ruangan = row.getCell(8).value ? String(row.getCell(8).value).trim() : undefined;
    const semester = String(row.getCell(9).value || '').trim();
    const tahunAjaran = String(row.getCell(10).value || '').trim();

    // Validate NIP → lookup guru_id
    if (!nip) { errors.push({ row: i, error: 'NIP kosong' }); continue; }
    const guruRows = await sql`SELECT id FROM guru WHERE nip = ${nip}`;
    if (!guruRows.length) { errors.push({ row: i, error: `NIP ${nip} tidak ditemukan` }); continue; }
    const guruId = guruRows[0].id;

    // Validate hari
    const hari = Number(hariRaw);
    if (![1, 2, 3, 4, 5, 6].includes(hari)) {
      errors.push({ row: i, error: `Hari harus 1-6, dapat ${hariRaw}` });
      continue;
    }

    // Validate jam_ke
    const jamKe = Number(jamKeRaw);
    if (!Number.isInteger(jamKe) || jamKe < 1 || jamKe > 10) {
      errors.push({ row: i, error: `Jam ke harus 1-10, dapat ${jamKeRaw}` });
      continue;
    }

    // Validate jam_mulai / jam_selesai
    if (!jamMulai) { errors.push({ row: i, error: 'Jam Mulai kosong atau format salah (harus HH:MM)' }); continue; }
    if (!jamSelesai) { errors.push({ row: i, error: 'Jam Selesai kosong atau format salah (harus HH:MM)' }); continue; }

    // Validate wajib
    if (!kelas) { errors.push({ row: i, error: 'Kelas kosong' }); continue; }
    if (!mapel) { errors.push({ row: i, error: 'Mapel kosong' }); continue; }
    if (!semester || !['ganjil', 'genap'].includes(semester)) {
      errors.push({ row: i, error: `Semester harus ganjil/genap, dapat ${semester}` });
      continue;
    }
    if (!tahunAjaran) { errors.push({ row: i, error: 'Tahun Ajaran kosong' }); continue; }

    try {
      const result = await sql`
        INSERT INTO jadwal (guru_id, hari, jam_ke, jam_mulai, jam_selesai, kelas, mapel, ruangan, semester, tahun_ajaran)
        VALUES (${guruId}, ${hari}, ${jamKe}, ${jamMulai}, ${jamSelesai}, ${kelas}, ${mapel}, ${ruangan || null}, ${semester}, ${tahunAjaran})
        ON CONFLICT (guru_id, hari, jam_ke, semester, tahun_ajaran) DO UPDATE SET
          jam_mulai = EXCLUDED.jam_mulai,
          jam_selesai = EXCLUDED.jam_selesai,
          kelas = EXCLUDED.kelas,
          mapel = EXCLUDED.mapel,
          ruangan = EXCLUDED.ruangan
        RETURNING CASE WHEN xmax = 0 THEN 'insert' ELSE 'update' END AS action
      `;
      if (result[0]?.action === 'insert') inserted++;
      else updated++;
    } catch (e: any) {
      errors.push({ row: i, error: e.message });
    }
  }

  return NextResponse.json({ inserted, updated, errors });
}
```

- [ ] **Step 2: Verify build passes**

Run: `npx tsc --noEmit -p web/tsconfig.json`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add web/src/app/api/import/jadwal/route.ts
git commit -m "feat: import jadwal xlsx endpoint"
```

---

### Task 5: UI guru page — Download + Import buttons

**Files:**
- Modify: `web/src/app/guru/page.tsx`

**Interfaces:**
- Consumes: existing `Guru` interface, existing `setGuru` state
- Produces: download link + file input + result alert

- [ ] **Step 1: Add state, refs, and useRef import**

Update import:
```tsx
import { useState, useEffect, useRef } from 'react';
```

Tambahkan di component:
```tsx
const fileRef = useRef<HTMLInputElement>(null);
const [importResult, setImportResult] = useState<{ inserted: number; updated: number; errors: any[] } | null>(null);
```

- [ ] **Step 2: Add import handler function**

```tsx
const handleImportGuru = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/import/guru', { method: 'POST', body: fd });
  const data = await res.json();
  setImportResult(data);
  setGuru(await fetch('/api/guru').then(r => r.json()));
  e.target.value = '';
};
```

- [ ] **Step 3: Add buttons and result display in JSX**

Tambahkan di samping tombol "+ Tambah" (di dalam `flex justify-between` div):
```tsx
<a
  href="/api/export/guru-template"
  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
>
  Download Template
</a>
<input
  type="file"
  accept=".xlsx"
  onChange={handleImportGuru}
  className="hidden"
  ref={fileRef}
/>
<button
  onClick={() => fileRef.current?.click()}
  className="bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 text-sm ml-2"
>
  Import Excel
</button>
```

Tambahkan di bawah tombol (sebelum table) untuk menampilkan hasil import:
```tsx
{importResult && (
  <div className="mb-4 p-3 rounded-lg bg-slate-100 text-sm">
    <p>✅ Tambah: {importResult.inserted} | Update: {importResult.updated}</p>
    {importResult.errors.length > 0 && (
      <details>
        <summary className="cursor-pointer text-red-600 font-medium">
          ❌ {importResult.errors.length} error(s)
        </summary>
        <ul className="mt-1 text-red-500">
          {importResult.errors.map((err: any, idx: number) => (
            <li key={idx}>Row {err.row}: {err.error}{err.nip ? ` (NIP: ${err.nip})` : ''}</li>
          ))}
        </ul>
      </details>
    )}
  </div>
)}
```

- [ ] **Step 4: Verify build passes**

Run: `npx tsc --noEmit -p web/tsconfig.json`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add web/src/app/guru/page.tsx
git commit -m "feat: add download/import buttons to guru page"
```

---

### Task 6: UI jadwal page — Download + Import buttons

**Files:**
- Modify: `web/src/app/jadwal/page.tsx`

**Interfaces:**
- Consumes: existing `Jadwal` interface, existing `setData` state
- Produces: download link + file input + result alert (same pattern as guru page)

- [ ] **Step 1: Add state, refs, and useRef import**

Update import:
```tsx
import { useState, useEffect, useRef } from 'react';
```

Tambahkan di component:
```tsx
const fileRef = useRef<HTMLInputElement>(null);
const [importResult, setImportResult] = useState<{ inserted: number; updated: number; errors: any[] } | null>(null);
```

- [ ] **Step 2: Add import handler function**

```tsx
const handleImportJadwal = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/import/jadwal', { method: 'POST', body: fd });
  const data = await res.json();
  setImportResult(data);
  setData(await fetch('/api/jadwal').then(r => r.json()));
  e.target.value = '';
};
```

- [ ] **Step 3: Add buttons and result display in JSX**

Tambahkan di samping tombol "+ Tambah" (di dalam `flex justify-between` div):
```tsx
<a
  href="/api/export/jadwal-template"
  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
>
  Download Template
</a>
<input
  type="file"
  accept=".xlsx"
  onChange={handleImportJadwal}
  className="hidden"
  ref={fileRef}
/>
<button
  onClick={() => fileRef.current?.click()}
  className="bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 text-sm ml-2"
>
  Import Excel
</button>
```

Tambahkan di bawah tombol (sebelum table) untuk menampilkan hasil import:
```tsx
{importResult && (
  <div className="mb-4 p-3 rounded-lg bg-slate-100 text-sm">
    <p>✅ Tambah: {importResult.inserted} | Update: {importResult.updated}</p>
    {importResult.errors.length > 0 && (
      <details>
        <summary className="cursor-pointer text-red-600 font-medium">
          ❌ {importResult.errors.length} error(s)
        </summary>
        <ul className="mt-1 text-red-500">
          {importResult.errors.map((err: any, idx: number) => (
            <li key={idx}>Row {err.row}: {err.error}</li>
          ))}
        </ul>
      </details>
    )}
  </div>
)}
```

- [ ] **Step 4: Verify build passes**

Run: `npx tsc --noEmit -p web/tsconfig.json`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add web/src/app/jadwal/page.tsx
git commit -m "feat: add download/import buttons to jadwal page"
```

---

### Task 7: Final build + test + push

- [ ] **Step 1: Full build**

Run: `npm run web:build`
Expected: no errors, successful compilation

- [ ] **Step 2: Push**

```bash
git push
```

- [ ] **Step 3: Verify on Vercel**

Wait ~1 min for Vercel deploy, then test:
1. Open web dashboard → login as admin
2. `/guru` page → click "Download Template" → verify .xlsx downloads with correct columns
3. `/jadwal` page → click "Download Template" → verify .xlsx downloads with correct columns
4. Test import with a small .xlsx file → verify rows processed and result shown

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: excel import/export guru & jadwal"
git push
```