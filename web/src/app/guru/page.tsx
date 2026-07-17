import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export default async function GuruPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const rows = await sql`
    SELECT id, nip, nama, no_wa, jabatan FROM guru ORDER BY nama ASC
  `;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Daftar Guru</h1>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="p-3 font-semibold text-slate-700">NIP</th>
              <th className="p-3 font-semibold text-slate-700">Nama</th>
              <th className="p-3 font-semibold text-slate-700">No. WA</th>
              <th className="p-3 font-semibold text-slate-700">Jabatan</th>
              <th className="p-3 font-semibold text-slate-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-400">Belum ada data guru</td></tr>
            )}
            {rows.map((g: Record<string, unknown>) => (
              <tr key={String(g.id)} className="border-t hover:bg-slate-50">
                <td className="p-3">{String(g.nip)}</td>
                <td className="p-3 font-medium">{String(g.nama)}</td>
                <td className="p-3">{String(g.no_wa)}</td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded text-xs bg-slate-100 text-slate-700">
                    {String(g.jabatan)}
                  </span>
                </td>
                <td className="p-3">
                  <Link href={`/guru/${String(g.id)}`} className="text-blue-600 hover:underline text-sm">
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
