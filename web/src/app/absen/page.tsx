'use client';
import { useState, useEffect } from 'react';

interface AbsenRow {
  id: number; tanggal: string; jam_ke: number; guru: string; kelas: string;
  mapel: string; status: string; foto_valid: boolean | null; foto_path: string | null;
  jarak_meter: number | null;
}

interface GuruItem { id: number; nama: string; }

export default function AbsenPage({
  searchParams,
}: {
  searchParams: { tanggal?: string; guru_id?: string };
}) {
  const [rows, setRows] = useState<AbsenRow[]>([]);
  const [guruList, setGuruList] = useState<GuruItem[]>([]);
  const [tanggal, setTanggal] = useState(searchParams.tanggal || new Date().toISOString().slice(0, 10));
  const [guruId, setGuruId] = useState(searchParams.guru_id || '');
  const [loading, setLoading] = useState(true);

  const fetchData = async (t: string, g: string) => {
    setLoading(true);
    const params = new URLSearchParams({ tanggal: t });
    if (g) params.set('guru_id', g);
    const [absenRes, guruRes] = await Promise.all([
      fetch(`/api/absen?${params}`),
      fetch('/api/guru'),
    ]);
    const absenData = await absenRes.json();
    const guruData = await guruRes.json();
    setRows(Array.isArray(absenData) ? absenData : []);
    setGuruList(guruData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData(tanggal, guruId);
  }, []);

  const handleTanggalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = e.target.value;
    setTanggal(t);
    fetchData(t, guruId);
  };

  const handleGuruChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const g = e.target.value;
    setGuruId(g);
    fetchData(tanggal, g);
  };

  const statusColor: Record<string, string> = {
    hadir: 'bg-green-100 text-green-800',
    terlambat: 'bg-yellow-100 text-yellow-800',
    tidak_hadir: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-bold mb-4">Absen Harian</h1>

      <div className="mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Tanggal</label>
          <input
            type="date"
            value={tanggal}
            onChange={handleTanggalChange}
            className="px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Filter Guru</label>
          <select
            value={guruId}
            onChange={handleGuruChange}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Semua Guru</option>
            {guruList.map((g) => (
              <option key={g.id} value={String(g.id)}>{g.nama}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-400">Memuat...</div>
        ) : (
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
              {rows.map((a) => (
                <tr key={a.id} className="border-t hover:bg-slate-50">
                  <td className="p-3">{a.guru}</td>
                  <td className="p-3">{a.jam_ke}</td>
                  <td className="p-3">{a.kelas}</td>
                  <td className="p-3">{a.mapel}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${statusColor[a.status] || 'bg-gray-100 text-gray-800'}`}>
                      {a.status}
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
                    {a.jarak_meter !== null ? `${a.jarak_meter.toFixed(1)} m` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
