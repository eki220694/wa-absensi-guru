'use client';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2 } from 'lucide-react';

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<{ inserted: number; updated: number; errors: any[] } | null>(null);

  const reload = async () => {
    const [j, g] = await Promise.all([
      fetch('/api/jadwal').then(r => r.json()),
      fetch('/api/guru').then(r => r.json()),
    ]);
    setData(j); setGuruList(g);
  };
  useEffect(() => { reload(); }, []);

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
    if (res.ok) { setModal(false); reload(); }
    else alert((await res.json()).error);
  };

  const hapus = async (id: number) => {
    if (!confirm('Hapus jadwal ini?')) return;
    await fetch(`/api/jadwal/${id}`, { method: 'DELETE' });
    reload();
  };

  const handleImportJadwal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/import/jadwal', { method: 'POST', body: fd });
    const data = await res.json();
    setImportResult(data); reload();
    e.target.value = '';
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Jadwal Mengajar</h1>
        <div className="flex gap-2 items-center">
          <a href="/api/export/jadwal-template" className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-2.5 py-1 text-sm font-medium hover:bg-muted hover:text-foreground transition-all h-7 gap-1">Download Template</a>
          <input type="file" accept=".xlsx" onChange={handleImportJadwal} className="hidden" ref={fileRef} />
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>Import Excel</Button>
          <Button size="sm" onClick={openAdd}>+ Tambah</Button>
        </div>
      </div>
      {importResult && (
        <div className="p-4 rounded-lg bg-muted text-sm">
          <p>✅ Tambah: {importResult.inserted} | Update: {importResult.updated}</p>
          {importResult.errors.length > 0 && (
            <details>
              <summary className="cursor-pointer text-destructive font-medium">❌ {importResult.errors.length} error(s)</summary>
              <ul className="mt-1 text-destructive">
                {importResult.errors.map((err: any, idx: number) => (
                  <li key={idx}>Row {err.row}: {err.error}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hari</TableHead><TableHead>Jam</TableHead><TableHead>Guru</TableHead>
              <TableHead>Kelas</TableHead><TableHead>Mapel</TableHead><TableHead>Ruangan</TableHead><TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Belum ada jadwal</TableCell></TableRow>
            )}
            {data.map((j) => (
              <TableRow key={j.id}>
                <TableCell>{hariMap[j.hari]}</TableCell>
                <TableCell>{j.jam_ke} ({j.jam_mulai}-{j.jam_selesai})</TableCell>
                <TableCell>{j.guru_nama}</TableCell>
                <TableCell>{j.kelas}</TableCell>
                <TableCell>{j.mapel}</TableCell>
                <TableCell>{j.ruangan || '-'}</TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="link" size="icon-sm" aria-label="Edit jadwal" onClick={() => openEdit(j)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="link" size="icon-sm" className="text-destructive" aria-label="Hapus jadwal" onClick={() => hapus(j.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{edit ? 'Edit Jadwal' : 'Tambah Jadwal'}</DialogTitle>
            <DialogDescription>
              {edit ? 'Ubah jadwal mengajar.' : 'Tambahkan jadwal mengajar baru.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Guru</Label>
              <Select value={String(guruId)} onValueChange={v => setGuruId(v ? Number(v) : 0)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Pilih Guru" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Pilih Guru</SelectItem>
                  {guruList.map((g: any) => <SelectItem key={g.id} value={String(g.id)}>{g.nama}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Hari</Label>
                <Select value={String(hari)} onValueChange={v => setHari(Number(v))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {hariMap.slice(1).map((h, i) => <SelectItem key={i + 1} value={String(i + 1)}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Jam Ke</Label>
                <Input type="number" min={1} max={10} value={jamKe} onChange={e => setJamKe(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Mulai</Label>
                <Input type="time" value={jamMulai} onChange={e => setJamMulai(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Selesai</Label>
                <Input type="time" value={jamSelesai} onChange={e => setJamSelesai(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Kelas</Label>
              <Input type="text" value={kelas} onChange={e => setKelas(e.target.value)} placeholder="X TKJ 1" />
            </div>
            <div className="space-y-1">
              <Label>Mapel</Label>
              <Input type="text" value={mapel} onChange={e => setMapel(e.target.value)} placeholder="Pemrograman Web" />
            </div>
            <div className="space-y-1">
              <Label>Ruangan</Label>
              <Input type="text" value={ruangan} onChange={e => setRuangan(e.target.value)} placeholder="Lab Kom 1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(false)}>Batal</Button>
            <Button onClick={save}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}