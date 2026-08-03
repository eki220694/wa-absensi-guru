import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const [counts] = await sql`
    SELECT
      (SELECT COUNT(*) FROM guru) AS total_guru,
      (SELECT COUNT(*) FROM absen WHERE tanggal = CURRENT_DATE) AS absen_hari_ini,
      (SELECT COUNT(*) FROM izin WHERE status = 'pending') AS izin_pending
  `;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang, {session.user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Guru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(counts?.total_guru ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Absen Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(counts?.absen_hari_ini ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Izin Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(counts?.izin_pending ?? 0)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
