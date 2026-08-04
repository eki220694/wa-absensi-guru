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
  const lastDay = new Date(Number(tahun), Number(bulan), 0).getDate();
  const end = `${tahun}-${String(bulan).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const rows = await sql`
    SELECT a.tanggal, a.jam_ke, a.status, a.jarak_meter, a.foto_valid,
           g.nip, g.nama as guru, j.kelas, j.mapel
    FROM absen a
    JOIN guru g ON a.guru_id = g.id
    JOIN jadwal j ON a.jadwal_id = j.id
    WHERE a.tanggal >= ${start} AND a.tanggal <= ${end}
    ORDER BY a.tanggal, g.nama, a.jam_ke
  `;

  if (!rows.length) {
    return NextResponse.json(
      { error: `Tidak ada data absensi untuk bulan ${bulan}/${tahun}.` },
      { status: 404 },
    );
  }

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
      const w = colWidths[i] ?? 60;
      doc.rect(x, y, w, 20).stroke();
      doc.text(h, x + 2, y + 5, { width: w - 4, align: 'left' });
      x += w;
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
      const w = colWidths[i] ?? 60;
      doc.rect(x, y, w, 18).stroke();
      doc.text(c, x + 2, y + 4, { width: w - 4 });
      x += w;
    });
    y += 18;
  }

  const buffer = await new Promise<Uint8Array>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks as unknown as Uint8Array[])));
    doc.on('error', reject);
    doc.end();
  });

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="rekap-absensi-${tahun}-${String(bulan).padStart(2, '0')}.pdf"`,
    },
  });
}