'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';


interface IzinRow {
  id: number;
  guru: string;
  jenis: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  alasan: string | null;
  status: string;
  bukti_path: string | null;
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
    const id = setInterval(() => { if (document.visibilityState === 'visible') fetchData(); }, 15000);
    return () => clearInterval(id);
  }, []);

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    disetujui: 'bg-green-100 text-green-800',
    ditolak: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 stagger-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 font-bold tracking-tight">Daftar Izin</h1>
        </div>
      </div>
      {lastUpdated && <p className="text-xs text-muted-foreground">🔄 Auto-refresh 15 detik · Terakhir diperbarui {lastUpdated}</p>}
      <div className="rounded-xl border overflow-hidden e-2">
        <Table density="compact">
          <TableHeader>
            <TableRow>
              <TableHead>Guru</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Alasan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6}><div className="skeleton h-12"></div></TableCell></TableRow>
                ))}
              </>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Belum ada pengajuan izin</TableCell></TableRow>
            ) : (
              rows.map((i) => (
                <TableRow key={String(i.id)}>
                  <TableCell className="font-medium">{String(i.guru)}</TableCell>
                  <TableCell className="capitalize">{String(i.jenis)}</TableCell>
                  <TableCell className="text-sm">{String(i.tanggal_mulai)} - {String(i.tanggal_selesai)}</TableCell>
                  <TableCell className="max-w-xs truncate">{String(i.alasan) || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={String(i.status) === 'disetujui' ? 'success' : String(i.status) === 'ditolak' ? 'danger' : 'warning'}>
                      {String(i.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 items-center">
                      {String(i.status) === 'pending' && (
                        <>
                          <Button variant="ghost" size="icon-sm" className="text-success" aria-label="Setujui izin" onClick={() => updateStatus(i.id, 'disetujui')}><CheckCircle2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Tolak izin" onClick={() => updateStatus(i.id, 'ditolak')}><XCircle className="h-4 w-4" /></Button>
                        </>
                      )}
                      {String(i.status) === 'disetujui' && (
                        <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Batalkan izin" onClick={() => updateStatus(i.id, 'ditolak')}><XCircle className="h-4 w-4" /></Button>
                      )}
                      {String(i.status) === 'ditolak' && (
                        <Button variant="ghost" size="icon-sm" className="text-success" aria-label="Setujui izin" onClick={() => updateStatus(i.id, 'disetujui')}><CheckCircle2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                    {String(i.bukti_path) && (
                      <a href={String(i.bukti_path)} target="_blank" rel="noreferrer"
                         className="ml-2 text-xs underline text-primary">Bukti</a>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}