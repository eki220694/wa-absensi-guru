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
