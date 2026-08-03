import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import Link from 'next/link';

export default async function GuruDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const [guru] = await sql`SELECT * FROM guru WHERE id = ${params.id}`;
  if (!guru) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          Guru tidak ditemukan
        </div>
      </div>
    );
  }

  const rekap = await sql`
    SELECT a.tanggal, a.jam_ke, a.status, j.kelas, j.mapel
    FROM absen a
    JOIN jadwal j ON a.jadwal_id = j.id
    WHERE a.guru_id = ${params.id}
    ORDER BY a.tanggal DESC, a.jam_ke DESC
    LIMIT 50
  `;

  const statusColor: Record<string, string> = {
    hadir: 'bg-green-100 text-green-800',
    terlambat: 'bg-yellow-100 text-yellow-800',
    tidak_hadir: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <Link href="/guru" className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground h-7 gap-1 px-2.5 py-1">
        ← Kembali
      </Link>

      <h1 className="text-2xl font-bold">{String(guru.nama)}</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Data Guru</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">NIP</p>
            <p className="font-medium">{String(guru.nip)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">No. WA</p>
            <p className="font-medium">{String(guru.no_wa)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Jabatan</p>
            <p className="font-medium capitalize">{String(guru.jabatan)}</p>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-bold">Riwayat Absen (50 terakhir)</h2>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jam Ke</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead>Mapel</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rekap.length === 0 && (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Belum ada riwayat absen</TableCell></TableRow>
            )}
            {rekap.map((a: Record<string, unknown>) => (
              <TableRow key={`${String(a.tanggal)}-${String(a.jam_ke)}`}>
                <TableCell>{String(a.tanggal)}</TableCell>
                <TableCell>{String(a.jam_ke)}</TableCell>
                <TableCell>{String(a.kelas)}</TableCell>
                <TableCell>{String(a.mapel)}</TableCell>
                <TableCell>
                  <Badge className={statusColor[String(a.status)] || 'bg-gray-100 text-gray-800'}>
                    {String(a.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
