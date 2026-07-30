'use client';
import { useState, useEffect } from 'react';

interface Jadwal {
  id: number; guru_id: number; guru_nama: string; hari: number; jam_ke: number;
  jam_mulai: string; jam_selesai: string; kelas: string; mapel: string; ruangan: string | null;
}

const hariMap = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function JadwalPage() {
  const [data, setData] = useState<Jadwal[]>([]);
  const [guruList, setGuruList] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Jadwal | null>(null);
  const [guruId, setGuruId] = useState(0); const [hari, setHari] = useState(1);
  const [jamKe, setJamKe] = useState(1); const [jamMulai, setJamMulai] = useState('07:00');
  const [jamSelesai, setJamSelesai] = useState('07:40'); const [kelas, setKelas] = useState('');
  const [mapel, setMapel] = useState(''); const [ruangan, setRuangan] = useState('');

  useEffect(() => {
    fetch('/api/jadwal').then(r => r.json()).then(setData);
    fetch('/api/guru').then(r => r.json()).then(setGuruList);
  }, []);

  const openAdd = () => {
    setEdit(null); setGuruId(0); setHari(new Date().getDay() || 1); setJamKe(1);
    setJamMulai('07:00'); setJamSelesai('07:40'); setKelas(''); setMapel(''); setRuangan(''); setModal(true);
  };

  const openEdit = (j: Jadwal) => {
    setEdit(j); setGuruId(j.guru_id); setHari(j.hari); setJamKe(j.jam_ke);
    setJamMulai(j.jam_mulai); setJamSelesai(j.jam_selesai); setKelas(j.kelas); setMapel(j.mapel);
    setRuangan(j.ruangan || ''); setModal(true);
  };

  const save = async () => {
    const body = { guru_id: guruId, hari, jam_ke: jamKe, jam_mulai: jamMulai, jam_selesai: jamSelesai, kelas, mapel, ruangan: ruangan || null, semester: 'ganjil', tahun_ajaran: '2025/2026' };
    const res = await fetch('/api/jadwal', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edit ? { ...body, id: edit.id } : body),
    });
    if (res.ok) { setModal(false); setData(await fetch('/api/jadwal').then(r => r.json())); }
    else alert((await res.json()).error);
  };

  const hapus = async (id: number) => {
    if (!confirm('Hapus jadwal ini?')) return;
    await fetch(`/api/jadwal/${id}`, { method: 'DELETE' });
    setData(await fetch('/api/jadwal').then(r => r.json()));
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Jadwal Mengajar</h1>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Tambah</button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-slate-100 text-left">
            <th className="p-3">Hari</th><th className="p-3">Jam</th><th className="p-3">Guru</th>
            <th className="p-3">Kelas</th><th className="p-3">Mapel</th><th className="p-3">Ruangan</th><th className="p-3">Aksi</th>
          </tr></thead>
          <tbody>
            {data.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-gray-400">Belum ada jadwal</td></tr>}
            {data.map((j) => (
              <tr key={j.id} className="border-t hover:bg-slate-50">
                <td className="p-3">{hariMap[j.hari]}</td>
                <td className="p-3">{j.jam_ke} ({j.jam_mulai}-{j.jam_selesai})</td>
                <td className="p-3">{j.guru_nama}</td>
                <td className="p-3">{j.kelas}</td>
                <td className="p-3">{j.mapel}</td>
                <td className="p-3">{j.ruangan || '-'}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => openEdit(j)} className="text-blue-600 hover:underline text-sm">Edit</button>
                  <button onClick={() => hapus(j.id)} className="text-red-600 hover:underline text-sm">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl font-bold mb-4">{edit ? 'Edit Jadwal' : 'Tambah Jadwal'}</h2>
          <div className="space-y-3">
            <div><label className="block text-sm font-medium mb-1">Guru</label>
              <select value={guruId} onChange={e => setGuruId(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg">
                <option value={0}>Pilih Guru</option>
                {guruList.map((g: any) => <option key={g.id} value={g.id}>{g.nama}</option>)}
              </select></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-sm font-medium mb-1">Hari</label>
                <select value={hari} onChange={e => setHari(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg">
                  {hariMap.slice(1).map((h, i) => <option key={i+1} value={i+1}>{h}</option>)}
                </select></div>
              <div><label className="block text-sm font-medium mb-1">Jam Ke</label>
                <input type="number" min={1} max={10} value={jamKe} onChange={e => setJamKe(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-sm font-medium mb-1">Mulai</label>
                <input type="time" value={jamMulai} onChange={e => setJamMulai(e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Selesai</label>
                <input type="time" value={jamSelesai} onChange={e => setJamSelesai(e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Kelas</label>
              <input type="text" value={kelas} onChange={e => setKelas(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="X TKJ 1" /></div>
            <div><label className="block text-sm font-medium mb-1">Mapel</label>
              <input type="text" value={mapel} onChange={e => setMapel(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Pemrograman Web" /></div>
            <div><label className="block text-sm font-medium mb-1">Ruangan</label>
              <input type="text" value={ruangan} onChange={e => setRuangan(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Lab Kom 1" /></div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setModal(false)} className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Batal</button>
            <button onClick={save} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
