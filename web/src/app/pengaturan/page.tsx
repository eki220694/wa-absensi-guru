import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export default async function PengaturanPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const rows = await sql`SELECT key, value FROM config ORDER BY key`;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Pengaturan</h1>
      <div className="bg-white rounded-lg shadow overflow-x-auto max-w-2xl">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="p-3 font-semibold text-slate-700">Key</th>
              <th className="p-3 font-semibold text-slate-700">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c: Record<string, unknown>) => (
              <tr key={String(c.key)} className="border-t">
                <td className="p-3 font-mono text-sm text-slate-700">{String(c.key)}</td>
                <td className="p-3">
                  <form method="POST" action="/api/pengaturan" className="flex gap-2">
                    <input
                      type="hidden"
                      name="key"
                      value={String(c.key)}
                    />
                    <input
                      type="text"
                      name="value"
                      value={String(c.value)}
                      className="flex-1 px-3 py-1 border rounded text-sm"
                    />
                    <button type="submit" className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                      Simpan
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}