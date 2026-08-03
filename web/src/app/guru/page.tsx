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
import { Badge } from '@/components/ui/badge';

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<{ inserted: number; updated: number; errors: any[] } | null>(null);

  const reload = async () => setGuru(await fetch('/api/guru').then(r => r.json()));
  useEffect(() => { reload(); }, []);

  const openAdd = () => { setEdit(null); setNip(''); setNama(''); setNoHp(''); setJabatan('guru'); setPass(''); setModal(true); };
  const openEdit = (g: Guru) => { setEdit(g); setNip(g.nip); setNama(g.nama); setNoHp(g.no_wa); setJabatan(g.jabatan); setPass(''); setModal(true); };

  const save = async () => {
    const body = { nip, nama, no_wa: noHp, jabatan, password_hash: pass || undefined };
    const url = edit ? `/api/guru/${edit.id}` : '/api/guru';
    const method = edit ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { setModal(false); reload(); }
    else alert((await res.json()).error);
  };

  const hapus = async (id: number) => {
    if (!confirm('Hapus guru ini?')) return;
    await fetch(`/api/guru/${id}`, { method: 'DELETE' });
    reload();
  };

  const handleImportGuru = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/import/guru', { method: 'POST', body: fd });
    const data = await res.json();
    setImportResult(data);
    reload();
    e.target.value = '';
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Daftar Guru</h1>
        <div className="flex gap-2 items-center">
          <a href="/api/export/guru-template" className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-2.5 py-1 text-sm font-medium hover:bg-muted hover:text-foreground transition-all h-7 gap-1">Download Template</a>
          <input type="file" accept=".xlsx" onChange={handleImportGuru} className="hidden" ref={fileRef} />
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>Import Excel</Button>
          <Button size="sm" onClick={openAdd}>+ Tambah</Button>
        </div>
      </div>
      {importResult && (
        <div className="p-4 rounded-lg bg-muted text-sm">
          <p>✅ Tambah: {importResult.inserted} | Update: {importResult.updated}</p>
          {importResult.errors.length > 0 && (
            <details>
              <summary className="cursor-pointer text-destructive font-medium">
                ❌ {importResult.errors.length} error(s)
              </summary>
              <ul className="mt-1 text-destructive">
                {importResult.errors.map((err: any, idx: number) => (
                  <li key={idx}>Row {err.row}: {err.error}{err.nip ? ` (NIP: ${err.nip})` : ''}</li>
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
              <TableHead>NIP</TableHead><TableHead>Nama</TableHead><TableHead>No. HP/Telegram</TableHead>
              <TableHead>Jabatan</TableHead><TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guru.length === 0 && (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Belum ada data guru</TableCell></TableRow>
            )}
            {guru.map((g) => (
              <TableRow key={g.id}>
                <TableCell>{g.nip}</TableCell>
                <TableCell className="font-medium">{g.nama}</TableCell>
                <TableCell>{g.no_wa || '-'}</TableCell>
                <TableCell><Badge variant="secondary">{g.jabatan}</Badge></TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="link" size="sm" onClick={() => openEdit(g)}>Edit</Button>
                  <Button variant="link" size="sm" className="text-destructive" onClick={() => hapus(g.id)}>Hapus</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{edit ? 'Edit Guru' : 'Tambah Guru'}</DialogTitle>
            <DialogDescription>
              {edit ? 'Ubah data guru. Kosongkan password jika tidak diganti.' : 'Tambahkan guru baru ke sistem.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>NIP</Label>
              <Input type="text" value={nip} onChange={e => setNip(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Nama</Label>
              <Input type="text" value={nama} onChange={e => setNama(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>No. HP / Telegram ID</Label>
              <Input type="text" value={noHp} onChange={e => setNoHp(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Jabatan</Label>
              <Select value={jabatan} onValueChange={(v) => setJabatan(v ?? '')}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="guru">Guru</SelectItem>
                  <SelectItem value="wali_kelas">Wali Kelas</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{edit ? 'Password baru' : 'Password'}</Label>
              <Input type="password" value={pass} onChange={e => setPass(e.target.value)}
                placeholder={edit ? 'Biarkan kosong jika tidak diganti' : 'Password login'} />
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
