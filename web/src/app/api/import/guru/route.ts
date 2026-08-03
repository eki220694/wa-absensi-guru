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

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer) as unknown as Buffer;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as any);

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
