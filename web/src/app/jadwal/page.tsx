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
import { Pencil, Trash2, Plus, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Jadwal {
  id: number; guru_id: number; guru_nama: string; hari: number; jam_ke: number;
  jam_mulai: string; jam_selesai: string; kelas: string; mapel: string; ruangan: string | null;
}

const hariMap = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function JadwalPage() {
  const [data, setData] = useState<Jadwal[]>([]);
  const [guruList, setGuruList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Jadwal | null>(null);
  const [guruId, setGuruId] = useState(0); const [hari, setHari] = useState(1);
  const [jamKe, setJamKe] = useState(1); const [jamMulai, setJamMulai] = useState('07:00');
  const [jamSelesai, setJamSelesai] = useState('07:40'); const [kelas, setKelas] = useState('');
  const [mapel, setMapel] = useState(''); const [ruangan, setRuangan] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<{ inserted: number; updated: number; errors: any[] } | null>(null);

  const reload = async () => {
    setLoading(true);
    const [j, g] = await Promise.all([
      fetch('/api/jadwal').then(r => r.json()),
      fetch('/api/guru').then(r => r.json()),
    ]);
    setData(j); setGuruList(g);
    setLoading(false);
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
    if (res.ok) { setModal(false); reload(); toast.success(edit ? 'Jadwal diperbarui' : 'Jadwal ditambahkan'); }
    else { const err = await res.json(); toast.error(err.error || 'Gagal menyimpan'); }
  };

  const hapus = async (id: number) => {
    if (!confirm('Hapus jadwal ini?')) return;
    await fetch(`/api/jadwal/${id}`, { method: 'DELETE' });
    reload();
    toast.success('Jadwal dihapus');
  };

  const handleImportJadwal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/import/jadwal', { method: 'POST', body: fd });
    const data = await res.json();
    setImportResult(data); reload();
    e.target.value = '';
    toast.success(`Import selesai: ${data.inserted} ditambah, ${data.updated} diperbarui`);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 stagger-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 font-bold tracking-tight">Jadwal Mengajar</h1>
        </div>
        <div className="flex gap-2 items-center">
          <a href="/api/export/jadwal-template" className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted hover:text-foreground transition-all h-9">
            <Download className="h-4 w-4" /> Template
          </a>
          <input type="file" accept=".xlsx" onChange={handleImportJadwal} className="hidden" ref={fileRef} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" /> Import
          </Button>
          <Button size="sm" onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> Tambah</Button>
        </div>
      </div>

      {importResult && (
        <div className="p-4 rounded-lg bg-surface-2 text-sm">
          <p className="font-medium">✅ Import selesai — Tambah: {importResult.inserted} | Update: {importResult.updated}</p>
          {importResult.errors.length > 0 && (
            <details>
              <summary className="cursor-pointer text-destructive font-medium">❌ {importResult.errors.length} error(s)</summary>
              <ul className="mt-1 text-destructive text-xs">
                {importResult.errors.map((err: any, idx: number) => (
                  <li key={idx}>Row {err.row}: {err.error}{err.nip ? ` (NIP: ${err.nip})` : ''}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="rounded-xl border overflow-hidden e-2">
        <Table density="compact">
          <TableHeader>
            <TableRow>
              <TableHead>Hari</TableHead><TableHead>Jam</TableHead><TableHead>Guru</TableHead>
              <TableHead>Kelas</TableHead><TableHead>Mapel</TableHead><TableHead>Ruangan</TableHead><TableHead className="w-24">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={7}><div className="skeleton h-12"></div></TableCell></TableRow>
                ))}
              </>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Belum ada jadwal. Klik "Tambah" untuk memulai.</TableCell></TableRow>
            ) : (
              data.map((j) => (
                <TableRow key={j.id}>
                  <TableCell>{hariMap[j.hari]}</TableCell>
                  <TableCell><span className="font-mono text-sm">{j.jam_ke}</span> <span className="text-muted-foreground text-xs">({j.jam_mulai}-{j.jam_selesai})</span></TableCell>
                  <TableCell className="font-medium">{j.guru_nama}</TableCell>
                  <TableCell>{j.kelas}</TableCell>
                  <TableCell>{j.mapel}</TableCell>
                  <TableCell>{j.ruangan || '-'}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label="Edit jadwal" onClick={() => openEdit(j)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Hapus jadwal" onClick={() => hapus(j.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
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
