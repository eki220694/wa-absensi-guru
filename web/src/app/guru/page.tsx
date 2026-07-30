'use client';
import { useState, useEffect } from 'react';

interface Guru {
  id: number; nip: string; nama: string; no_wa: string; jabatan: string;
}

export default function GuruPage() {
  const [guru, setGuru] = useState<Guru[]>([]);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Guru | null>(null);
  const [nip, setNip] = useState(''); const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState(''); const [jabatan, setJabatan] = useState('guru');
  const [pass, setPass] = useState('');

  useEffect(() => { fetch('/api/guru').then(r => r.json()).then(setGuru); }, []);

  const openAdd = () => { setEdit(null); setNip(''); setNama(''); setNoHp(''); setJabatan('guru'); setPass(''); setModal(true); };
  const openEdit = (g: Guru) => { setEdit(g); setNip(g.nip); setNama(g.nama); setNoHp(g.no_wa); setJabatan(g.jabatan); setPass(''); setModal(true); };

  const save = async () => {
    const body = { nip, nama, no_wa: noHp, jabatan, password_hash: pass || undefined };
    const url = edit ? `/api/guru/${edit.id}` : '/api/guru';
    const method = edit ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { setModal(false); setGuru(await fetch('/api/guru').then(r => r.json())); }
    else alert((await res.json()).error);
  };

  const hapus = async (id: number) => {
    if (!confirm('Hapus guru ini?')) return;
    await fetch(`/api/guru/${id}`, { method: 'DELETE' });
    setGuru(await fetch('/api/guru').then(r => r.json()));
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daftar Guru</h1>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Tambah</button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-slate-100 text-left">
            <th className="p-3">NIP</th><th className="p-3">Nama</th><th className="p-3">No. HP/Telegram</th>
            <th className="p-3">Jabatan</th><th className="p-3">Aksi</th>
          </tr></thead>
          <tbody>
            {guru.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-400">Belum ada data guru</td></tr>}
            {guru.map((g) => (
              <tr key={g.id} className="border-t hover:bg-slate-50">
                <td className="p-3">{g.nip}</td>
                <td className="p-3 font-medium">{g.nama}</td>
                <td className="p-3">{g.no_wa || '-'}</td>
                <td className="p-3"><span className="px-2 py-1 rounded text-xs bg-slate-100">{g.jabatan}</span></td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => openEdit(g)} className="text-blue-600 hover:underline text-sm">Edit</button>
                  <button onClick={() => hapus(g.id)} className="text-red-600 hover:underline text-sm">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl font-bold mb-4">{edit ? 'Edit Guru' : 'Tambah Guru'}</h2>
          <div className="space-y-3">
            <div><label className="block text-sm font-medium mb-1">NIP</label>
              <input type="text" value={nip} onChange={e => setNip(e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Nama</label>
              <input type="text" value={nama} onChange={e => setNama(e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">No. HP / Telegram ID</label>
              <input type="text" value={noHp} onChange={e => setNoHp(e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Jabatan</label>
              <select value={jabatan} onChange={e => setJabatan(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                <option value="guru">Guru</option><option value="wali_kelas">Wali Kelas</option><option value="admin">Admin</option>
              </select></div>
            <div><label className="block text-sm font-medium mb-1">{edit ? 'Password baru (kosongkan biarkan)' : 'Password'}</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="w-full px-3 py-2 border rounded-lg"
                placeholder={edit ? 'Biarkan kosong jika tidak diganti' : 'Password login'} /></div>
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
