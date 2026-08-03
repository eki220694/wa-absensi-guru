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

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer) as unknown as Buffer;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as any);

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

    if (!nip) { errors.push({ row: i, error: 'NIP kosong' }); continue; }
    const guruRows = await sql`SELECT id FROM guru WHERE nip = ${nip}`;
    if (!guruRows.length) { errors.push({ row: i, error: `NIP ${nip} tidak ditemukan` }); continue; }
    const guruId = (guruRows[0] as any).id;

    const hari = Number(hariRaw);
    if (![1, 2, 3, 4, 5, 6].includes(hari)) {
      errors.push({ row: i, error: `Hari harus 1-6, dapat ${hariRaw}` }); continue;
    }

    const jamKe = Number(jamKeRaw);
    if (!Number.isInteger(jamKe) || jamKe < 1 || jamKe > 10) {
      errors.push({ row: i, error: `Jam ke harus 1-10, dapat ${jamKeRaw}` }); continue;
    }

    if (!jamMulai) { errors.push({ row: i, error: 'Jam Mulai kosong atau format salah (harus HH:MM)' }); continue; }
    if (!jamSelesai) { errors.push({ row: i, error: 'Jam Selesai kosong atau format salah (harus HH:MM)' }); continue; }
    if (!kelas) { errors.push({ row: i, error: 'Kelas kosong' }); continue; }
    if (!mapel) { errors.push({ row: i, error: 'Mapel kosong' }); continue; }
    if (!semester || !['ganjil', 'genap'].includes(semester)) {
      errors.push({ row: i, error: `Semester harus ganjil/genap, dapat ${semester}` }); continue;
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
