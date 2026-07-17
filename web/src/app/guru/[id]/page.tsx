import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

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
    <div className="p-8">
      <a href="/guru" className="text-blue-600 hover:underline text-sm mb-4 inline-block">&larr; Kembali</a>
      <h1 className="text-2xl font-bold mb-4">{String(guru.nama)}</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8 grid grid-cols-2 gap-4 max-w-lg">
        <div>
          <p className="text-sm text-gray-500">NIP</p>
          <p className="font-medium">{String(guru.nip)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">No. WA</p>
          <p className="font-medium">{String(guru.no_wa)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Jabatan</p>
          <p className="font-medium capitalize">{String(guru.jabatan)}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Riwayat Absen (50 terakhir)</h2>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="p-3 font-semibold text-slate-700">Tanggal</th>
              <th className="p-3 font-semibold text-slate-700">Jam Ke</th>
              <th className="p-3 font-semibold text-slate-700">Kelas</th>
              <th className="p-3 font-semibold text-slate-700">Mapel</th>
              <th className="p-3 font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {rekap.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-400">Belum ada riwayat absen</td></tr>
            )}
            {rekap.map((a: Record<string, unknown>) => (
              <tr key={`${String(a.tanggal)}-${String(a.jam_ke)}`} className="border-t hover:bg-slate-50">
                <td className="p-3">{String(a.tanggal)}</td>
                <td className="p-3">{String(a.jam_ke)}</td>
                <td className="p-3">{String(a.kelas)}</td>
                <td className="p-3">{String(a.mapel)}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${statusColor[String(a.status)] || 'bg-gray-100 text-gray-800'}`}>
                    {String(a.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
