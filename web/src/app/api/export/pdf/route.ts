import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import PDFDocument from 'pdfkit';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
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

  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

  doc.fontSize(16).text('SMAN 6 SIGI - Rekap Absensi Bulanan', { align: 'center' });
  doc.fontSize(12).text(`Bulan: ${bulan}/${tahun}`, { align: 'center' });
  doc.moveDown(2);

  const colWidths = [70, 60, 100, 40, 70, 90, 60, 60, 60];
  const headers = ['Tanggal', 'NIP', 'Guru', 'Jam', 'Kelas', 'Mapel', 'Status', 'Jarak', 'Foto'];
  const startX = 30;

  let y = doc.y;

  const drawTableHeader = () => {
    doc.font('Helvetica-Bold').fontSize(9);
    let x = startX;
    headers.forEach((h, i) => {
      doc.rect(x, y, colWidths[i], 20).stroke();
      doc.text(h, x + 2, y + 5, { width: colWidths[i] - 4, align: 'left' });
      x += colWidths[i];
    });
    y += 20;
  };

  drawTableHeader();
  doc.font('Helvetica').fontSize(8);

  for (const r of rows) {
    if (y > 500) {
      doc.addPage();
      y = 30;
      drawTableHeader();
    }
    let x = startX;
    const cells = [
      String(r.tanggal),
      String(r.nip),
      String(r.guru),
      String(r.jam_ke),
      String(r.kelas),
      String(r.mapel),
      String(r.status),
      r.jarak_meter ? Number(r.jarak_meter).toFixed(1) : '-',
      r.foto_valid ? 'Ya' : 'Tidak',
    ];
    cells.forEach((c, i) => {
      doc.rect(x, y, colWidths[i], 18).stroke();
      doc.text(c, x + 2, y + 4, { width: colWidths[i] - 4 });
      x += colWidths[i];
    });
    y += 18;
  }

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="rekap-absensi-${tahun}-${String(bulan).padStart(2, '0')}.pdf"`,
    },
  });
}