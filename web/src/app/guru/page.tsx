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
import { Pencil, Trash2, Plus, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';


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
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    setGuru(await fetch('/api/guru').then(r => r.json()));
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const openAdd = () => { setEdit(null); setNip(''); setNama(''); setNoHp(''); setJabatan('guru'); setPass(''); setModal(true); };
  const openEdit = (g: Guru) => { setEdit(g); setNip(g.nip); setNama(g.nama); setNoHp(g.no_wa); setJabatan(g.jabatan); setPass(''); setModal(true); };

  const save = async () => {
    const body = { nip, nama, no_wa: noHp, jabatan, password_hash: pass || undefined };
    const url = edit ? `/api/guru/${edit.id}` : '/api/guru';
    const method = edit ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { setModal(false); reload(); toast.success(edit ? 'Guru diperbarui' : 'Guru ditambahkan'); }
    else { const err = await res.json(); toast.error(err.error || 'Gagal menyimpan'); }
  };

  const hapus = async (id: number) => {
    if (!confirm('Hapus guru ini?')) return;
    await fetch(`/api/guru/${id}`, { method: 'DELETE' });
    reload();
    toast.success('Guru dihapus');
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
    toast.success(`Import selesai: ${data.inserted} ditambah, ${data.updated} diperbarui`);
  };

  const jabatanBadge = (j: string) => {
    const v: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
      admin: 'default', wali_kelas: 'success', guru: 'info'
    };
    return <Badge variant={v[j] || 'default'} className="capitalize">${j.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 stagger-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 font-bold tracking-tight">Daftar Guru</h1>
        </div>
        <div className="flex gap-2 items-center">
          <a href="/api/export/guru-template" className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted hover:text-foreground transition-all h-9">
            <Download className="h-4 w-4" /> Template
          </a>
          <input type="file" accept=".xlsx" onChange={handleImportGuru} className="hidden" ref={fileRef} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" /> Import
          </Button>
          <Button size="sm" onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> Tambah</Button>
        </div>
      </div>

      {importResult && (
        <div className="p-4 rounded-lg bg-surface-2 text-sm">
          <p className="font-medium">��� Import selesai — Tambah: ${importResult.inserted} | Update: ${importResult.updated}</p>
          {importResult.errors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-destructive font-medium">��� ${importResult.errors.length} error(s)</summary>
              <ul className="mt-1 text-destructive text-xs">
                {importResult.errors.map((err: any, idx: number) => (
                  <li key={idx}>Row ${err.row}: ${err.error}${err.nip ? ` (NIP: ${err.nip})` : ''}</li>
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
              <TableHead>NIP</TableHead><TableHead>Nama</TableHead><TableHead>No. HP/Telegram</TableHead>
              <TableHead>Jabatan</TableHead><TableHead className="w-24">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <>
                <TableRow><TableCell colSpan={5}><div className="skeleton h-12"></div></TableCell></TableRow>
                <TableRow><TableCell colSpan={5}><div className="skeleton h-12"></div></TableCell></TableRow>
                <TableRow><TableCell colSpan={5}><div className="skeleton h-12"></div></TableCell></TableRow>
              </>
            ) : guru.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Belum ada data guru. Klik "Tambah" untuk memulai.</TableCell></TableRow>
            ) : (
              guru.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-mono text-sm">${g.nip}</TableCell>
                  <TableCell className="font-medium">${g.nama}</TableCell>
                  <TableCell>${g.no_wa || '-'}</TableCell>
                  <TableCell>${jabatanBadge(g.jabatan)}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label="Edit guru" onClick={() => openEdit(g)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Hapus guru" onClick={() => hapus(g.id)}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>${edit ? 'Edit Guru' : 'Tambah Guru'}</DialogTitle>
            <DialogDescription>
              ${edit ? 'Ubah data guru. Kosongkan password jika tidak diganti.' : 'Tambahkan guru baru ke sistem.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>NIP</Label>
              <Input type="text" value={nip} onChange={e => setNip(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Nama</Label>
              <Input type="text" value={nama} onChange={e => setNama(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>No. HP / Telegram ID</Label>
              <Input type="text" value={noHp} onChange={e => setNoHp(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Jabatan</Label>
              <Select value={jabatan} onValueChange={(v) => setJabatan(v ?? '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Pilih jabatan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="guru">Guru</SelectItem>
                  <SelectItem value="wali_kelas">Wali Kelas</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>${edit ? 'Password baru' : 'Password'}</Label>
              <Input type="password" value={pass} onChange={e => setPass(e.target.value)}
                placeholder={edit ? 'Biarkan kosong jika tidak diganti' : 'Password login'} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(false)}>Batal</Button>
            <Button onClick={save}>${edit ? 'Update' : 'Simpan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
