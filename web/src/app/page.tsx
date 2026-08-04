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
  });
  let chartData: { daily: any[]; status: any[] } = { daily: [], status: [] };
  if (res.ok) chartData = await res.json();

  const statCards = [
    { title: 'Total Guru', value: Number(counts?.total_guru ?? 0), Icon: UsersRound, color: 'text-blue-600', bg: 'bg-blue-100/70' },
    { title: 'Absen Hari Ini', value: Number(counts?.absen_hari_ini ?? 0), Icon: CalendarCheck, color: 'text-green-600', bg: 'bg-green-100/70' },
    { title: 'Izin Pending', value: Number(counts?.izin_pending ?? 0), Icon: ClipboardClock, color: 'text-amber-600', bg: 'bg-amber-100/70' },
  ];

  return (
    <div className="min-h-[100dvh] p-4 lg:p-8 space-y-6 stagger-in">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Selamat datang, {session.user?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-in">
        {statCards.map((s) => (
          <Card key={s.title} className="relative overflow-hidden card-hover shadow-md group">
            <div className="absolute top-0 right-0 w-16 h-16 opacity-10" style={{
              background: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
              backgroundSize: '8px 8px',
            }}></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.Icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 stagger-in">
        <Card className="card-hover shadow-md">
          <CardHeader>
            <CardTitle>Absen Harian 7 Hari Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyLineChart data={chartData.daily} />
          </CardContent>
        </Card>
        <Card className="card-hover shadow-md">
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