'use client';
import { useState, useEffect } from 'react';

export default function PengaturanPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [edit, setEdit] = useState<string | null>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    fetch('/api/pengaturan?raw=1').then(r => r.json()).then((rows: any[]) => {
      const obj: Record<string, string> = {};
      rows.forEach((r: any) => { obj[r.key] = r.value; });
      setConfig(obj);
    });
  }, []);

  const simpan = async (key: string) => {
    const res = await fetch('/api/pengaturan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    if (res.ok) { setConfig({ ...config, [key]: value }); setEdit(null); }
    else alert((await res.json()).error);
  };

  const labelMap: Record<string, string> = {
    latitude_sekolah: 'Latitude Sekolah',
    longitude_sekolah: 'Longitude Sekolah',
    radius_absen: 'Radius Absen (meter)',
    jam_mulai: 'Jam Mulai Sekolah',
    jam_selesai: 'Jam Selesai Sekolah',
  };

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">Pengaturan</h1>
      <div className="bg-white rounded-lg shadow max-w-xl">
        {Object.entries(config).map(([key, val]) => (
          <div key={key} className="border-t first:border-t-0 p-4 flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium">{labelMap[key] || key}</p>
              {edit === key ? (
                <div className="flex gap-2 mt-1">
                  <input type="text" value={value} onChange={e => setValue(e.target.value)}
                    className="flex-1 px-3 py-1 border rounded-lg text-sm" autoFocus />
                  <button onClick={() => simpan(key)} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Simpan</button>
                  <button onClick={() => setEdit(null)} className="px-3 py-1 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">Batal</button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-0.5">{val}</p>
              )}
            </div>
            {edit !== key && (
              <button onClick={() => { setEdit(key); setValue(val); }}
                className="text-blue-600 hover:underline text-sm whitespace-nowrap ml-4">Ubah</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
