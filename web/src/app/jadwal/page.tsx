import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export default async function JadwalPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const rows = await sql`
    SELECT j.id, g.nama as guru, j.hari, j.jam_ke, j.kelas, j.mapel, j.ruangan, j.jam_mulai, j.jam_selesai
    FROM jadwal j
    JOIN guru g ON j.guru_id = g.id
    ORDER BY j.hari, j.jam_ke
  `;

  const hariMap = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Jadwal Mengajar</h1>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="p-3 font-semibold text-slate-700">Hari</th>
              <th className="p-3 font-semibold text-slate-700">Jam</th>
              <th className="p-3 font-semibold text-slate-700">Guru</th>
              <th className="p-3 font-semibold text-slate-700">Kelas</th>
              <th className="p-3 font-semibold text-slate-700">Mapel</th>
              <th className="p-3 font-semibold text-slate-700">Ruangan</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">Belum ada jadwal</td></tr>
            )}
            {rows.map((j: Record<string, unknown>) => (
              <tr key={String(j.id)} className="border-t hover:bg-slate-50">
                <td className="p-3">{hariMap[Number(j.hari)]}</td>
                <td className="p-3">
                  {String(j.jam_ke)} ({String(j.jam_mulai).slice(0,5)}-{String(j.jam_selesai).slice(0,5)})
                </td>
                <td className="p-3">{String(j.guru)}</td>
                <td className="p-3">{String(j.kelas)}</td>
                <td className="p-3">{String(j.mapel)}</td>
                <td className="p-3">{String(j.ruangan) || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}