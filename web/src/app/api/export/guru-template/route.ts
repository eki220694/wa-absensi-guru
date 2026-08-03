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
