import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyLineChart, StatusBarChart } from "@/components/DashboardCharts";
import { UsersRound, CalendarCheck, ClipboardClock, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [counts] = await sql`
    SELECT
      (SELECT COUNT(*) FROM guru) AS total_guru,
      (SELECT COUNT(*) FROM absen WHERE tanggal = CURRENT_DATE) AS absen_hari_ini,
      (SELECT COUNT(*) FROM izin WHERE status = 'pending') AS izin_pending
  `;

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/absen/range?range=7d`, { cache: "no-store" });
  let chartData: { daily: any[]; status: any[] } = { daily: [], status: [] };
  if (res.ok) chartData = await res.json();

  const statCards = [
    { title: "Total Guru", value: Number(counts?.total_guru ?? 0), Icon: UsersRound, color: "text-primary", bg: "bg-primary/10" },
    { title: "Absen Hari Ini", value: Number(counts?.absen_hari_ini ?? 0), Icon: CalendarCheck, color: "text-success", bg: "bg-success/10" },
    { title: "Izin Pending", value: Number(counts?.izin_pending ?? 0), Icon: ClipboardClock, color: "text-warning", bg: "bg-warning/10" },
  ];

  return (
    <div className="min-h-[100dvh] p-4 lg:p-8 space-y-6 stagger-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selamat datang, <span className="font-medium text-foreground">{session.user?.name}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-in">
        {statCards.map((s) => (
          <Card key={s.title} className="relative overflow-hidden e-2 group hover-lift transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.Icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-end justify-between gap-2">
                <div className="text-3xl font-bold tracking-tight text-foreground">{s.value}</div>
                <div className="flex items-center gap-1 text-success text-sm font-medium">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>+12%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 stagger-in">
        <Card className="e-2 hover-lift">
          <CardHeader>
            <CardTitle>Absen Harian 7 Hari Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyLineChart data={chartData.daily} />
          </CardContent>
        </Card>
        <Card className="e-2 hover-lift">
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
