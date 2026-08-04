import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DailyLineChart, StatusBarChart } from '@/components/DashboardCharts';
import { UsersRound, CalendarCheck, ClipboardClock } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const [counts] = await sql`
    SELECT
      (SELECT COUNT(*) FROM guru) AS total_guru,
      (SELECT COUNT(*) FROM absen WHERE tanggal = CURRENT_DATE) AS absen_hari_ini,
      (SELECT COUNT(*) FROM izin WHERE status = 'pending') AS izin_pending
  `;

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/absen/range?range=7d`, {
    cache: 'no-store',
    headers: { cookie: '' },
  });
  let chartData: { daily: any[]; status: any[] } = { daily: [], status: [] };
  if (res.ok) chartData = await res.json();

  const statCards = [
    { title: 'Total Guru', value: Number(counts?.total_guru ?? 0), Icon: UsersRound, color: 'text-blue-600', bg: 'bg-blue-100/70' },
    { title: 'Absen Hari Ini', value: Number(counts?.absen_hari_ini ?? 0), Icon: CalendarCheck, color: 'text-green-600', bg: 'bg-green-100/70' },
    { title: 'Izin Pending', value: Number(counts?.izin_pending ?? 0), Icon: ClipboardClock, color: 'text-yellow-600', bg: 'bg-yellow-100/70' },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Selamat datang, {session.user?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <Card key={s.title} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.Icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Absen Harian 7 Hari Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyLineChart data={chartData.daily} />
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Status Absen (7 Hari)</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBarChart data={chartData.status} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}