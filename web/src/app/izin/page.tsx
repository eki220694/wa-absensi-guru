import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export default async function IzinPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const rows = await sql`
    SELECT i.*, g.nama as guru
    FROM izin i
    JOIN guru g ON i.guru_id = g.id
    ORDER BY i.created_at DESC
    LIMIT 50
  `;

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    disetujui: 'bg-green-100 text-green-800',
    ditolak: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Daftar Izin</h1>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="p-3 font-semibold text-slate-700">Guru</th>
              <th className="p-3 font-semibold text-slate-700">Jenis</th>
              <th className="p-3 font-semibold text-slate-700">Tanggal</th>
              <th className="p-3 font-semibold text-slate-700">Alasan</th>
              <th className="p-3 font-semibold text-slate-700">Status</th>
              <th className="p-3 font-semibold text-slate-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">Belum ada pengajuan izin</td></tr>
            )}
            {rows.map((i: Record<string, unknown>) => (
              <tr key={String(i.id)} className="border-t hover:bg-slate-50">
                <td className="p-3">{String(i.guru)}</td>
                <td className="p-3 capitalize">{String(i.jenis)}</td>
                <td className="p-3">{String(i.tanggal_mulai)} - {String(i.tanggal_selesai)}</td>
                <td className="p-3">{String(i.alasan) || '-'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${statusColor[String(i.status)] || 'bg-gray-100 text-gray-800'}`}>
                    {String(i.status)}
                  </span>
                </td>
                <td className="p-3">
                  {String(i.status) === 'pending' && (
                    <form method="POST" action={`/api/izin/${String(i.id)}`} className="flex gap-2">
                      <button
                        type="submit"
                        name="status"
                        value="disetujui"
                        className="text-green-600 hover:underline text-sm"
                      >
                        Setuju
                      </button>
                      <button
                        type="submit"
                        name="status"
                        value="ditolak"
                        className="text-red-600 hover:underline text-sm"
                      >
                        Tolak
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}