import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

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
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Selamat datang, {session.user?.name}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Guru" value={counts.total_guru ?? 0} color="bg-blue-500" />
        <StatCard title="Absen Hari Ini" value={counts.absen_hari_ini ?? 0} color="bg-green-500" />
        <StatCard title="Izin Pending" value={counts.izin_pending ?? 0} color="bg-yellow-500" />
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-white text-xl font-bold`}>
        {value}
      </div>
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
