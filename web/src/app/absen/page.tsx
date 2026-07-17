import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export default async function AbsenPage({
  searchParams,
}: {
  searchParams: { tanggal?: string; guru_id?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const tanggal = searchParams.tanggal || new Date().toISOString().slice(0, 10);
  const guruId = searchParams.guru_id;

  let rows;
  if (guruId) {
    rows = await sql`
      SELECT a.*, g.nama as guru, j.kelas, j.mapel
      FROM absen a
      JOIN guru g ON a.guru_id = g.id
      JOIN jadwal j ON a.jadwal_id = j.id
      WHERE a.tanggal = ${tanggal} AND a.guru_id = ${guruId}
      ORDER BY a.jam_ke
    `;
  } else {
    rows = await sql`
      SELECT a.*, g.nama as guru, j.kelas, j.mapel
      FROM absen a
      JOIN guru g ON a.guru_id = g.id
      JOIN jadwal j ON a.jadwal_id = j.id
      WHERE a.tanggal = ${tanggal}
      ORDER BY g.nama, a.jam_ke
    `;
  }

  const guruList = await sql`SELECT id, nama FROM guru ORDER BY nama`;

  const statusColor: Record<string, string> = {
    hadir: 'bg-green-100 text-green-800',
    terlambat: 'bg-yellow-100 text-yellow-800',
    tidak_hadir: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Absen Harian</h1>

      <div className="mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Tanggal</label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => window.location.href = `/absen?tanggal=${e.target.value}${guruId ? `&guru_id=${guruId}` : ''}`}
            className="px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Filter Guru</label>
          <select
            value={guruId || ''}
            onChange={(e) => window.location.href = `/absen?tanggal=${tanggal}${e.target.value ? `&guru_id=${e.target.value}` : ''}`}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Semua Guru</option>
            {guruList.map((g: Record<string, unknown>) => (
              <option key={String(g.id)} value={String(g.id)}>{String(g.nama)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="p-3 font-semibold text-slate-700">Guru</th>
              <th className="p-3 font-semibold text-slate-700">Jam</th>
              <th className="p-3 font-semibold text-slate-700">Kelas</th>
              <th className="p-3 font-semibold text-slate-700">Mapel</th>
              <th className="p-3 font-semibold text-slate-700">Status</th>
              <th className="p-3 font-semibold text-slate-700">Foto</th>
              <th className="p-3 font-semibold text-slate-700">Jarak</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-gray-400">Belum ada absen pada tanggal ini</td></tr>
            )}
            {rows.map((a: Record<string, unknown>) => (
              <tr key={String(a.id)} className="border-t hover:bg-slate-50">
                <td className="p-3">{String(a.guru)}</td>
                <td className="p-3">{String(a.jam_ke)}</td>
                <td className="p-3">{String(a.kelas)}</td>
                <td className="p-3">{String(a.mapel)}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${statusColor[String(a.status)] || 'bg-gray-100 text-gray-800'}`}>
                    {String(a.status)}
                  </span>
                </td>
                <td className="p-3 text-center">
                  {a.foto_valid ? (
                    <span className="text-green-600">✅</span>
                  ) : a.foto_path ? (
                    <span className="text-yellow-600">⚠️</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="p-3">
                  {a.jarak_meter !== null ? `${Number(a.jarak_meter).toFixed(1)} m` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}