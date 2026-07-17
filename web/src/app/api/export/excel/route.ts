import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import ExcelJS from 'exceljs';

export async function GET(req: Request) {
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const bulan = url.searchParams.get('bulan');
  const tahun = url.searchParams.get('tahun');

  if (!bulan || !tahun) {
    return NextResponse.json({ error: 'Parameter bulan dan tahun wajib' }, { status: 400 });
  }

  const start = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
  const endDate = new Date(Number(tahun), Number(bulan), 0);
  const end = endDate.toISOString().slice(0, 10);

  const rows = await sql`
    SELECT a.tanggal, a.jam_ke, a.status, a.jarak_meter, a.foto_valid,
           g.nip, g.nama as guru, j.kelas, j.mapel
    FROM absen a
    JOIN guru g ON a.guru_id = g.id
    JOIN jadwal j ON a.jadwal_id = j.id
    WHERE a.tanggal >= ${start} AND a.tanggal <= ${end}
    ORDER BY a.tanggal, g.nama, a.jam_ke
  `;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Rekap Absensi');

  ws.columns = [
    { header: 'Tanggal', key: 'tanggal', width: 12 },
    { header: 'NIP', key: 'nip', width: 18 },
    { header: 'Guru', key: 'guru', width: 25 },
    { header: 'Jam Ke', key: 'jam_ke', width: 8 },
    { header: 'Kelas', key: 'kelas', width: 15 },
    { header: 'Mapel', key: 'mapel', width: 20 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Jarak (m)', key: 'jarak', width: 12 },
    { header: 'Foto Valid', key: 'foto_valid', width: 12 },
  ];

  ws.getRow(1).font = { bold: true };

  for (const r of rows) {
    ws.addRow({
      tanggal: String(r.tanggal),
      nip: String(r.nip),
      guru: String(r.guru),
      jam_ke: Number(r.jam_ke),
      kelas: String(r.kelas),
      mapel: String(r.mapel),
      status: String(r.status),
      jarak: r.jarak_meter ? Number(r.jarak_meter).toFixed(1) : '-',
      foto_valid: r.foto_valid ? 'Ya' : 'Tidak',
    });
  }

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="rekap-absensi-${tahun}-${String(bulan).padStart(2, '0')}.xlsx"`,
    },
  });
}