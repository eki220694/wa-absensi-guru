'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface IzinRow {
  id: number;
  guru: string;
  jenis: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  alasan: string | null;
  status: string;
  bukti_url: string | null;
}

export default function IzinPage() {
  const [rows, setRows] = useState<IzinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/izin');
      if (res.status === 401) return router.push('/login');
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
      setLastUpdated(new Date().toLocaleTimeString('id-ID'));
    } catch {
      setRows([]);
    }
    setLoading(false);
  };

  const updateStatus = async (id: number, status: 'disetujui' | 'ditolak') => {
    const res = await fetch(`/api/izin/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchData();
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchData();
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    disetujui: 'bg-green-100 text-green-800',
    ditolak: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Daftar Izin</h1>
      {lastUpdated && (
        <p className="text-xs text-gray-400 -mt-2 mb-4">🔄 Auto-refresh 15 detik · Terakhir diperbarui {lastUpdated}</p>
      )}
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
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">Memuat...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">Belum ada pengajuan izin</td></tr>
            ) : (
              rows.map((i) => (
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(i.id, 'disetujui')}
                          className="text-green-600 hover:underline text-sm"
                        >
                          Setuju
                        </button>
                        <button
                          onClick={() => updateStatus(i.id, 'ditolak')}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
