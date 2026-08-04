'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';

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
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Daftar Izin</h1>
      </div>
      {lastUpdated && <p className="text-xs text-muted-foreground">🔄 Auto-refresh 15 detik · Terakhir diperbarui {lastUpdated}</p>}
      <div className="rounded-lg border overflow-x-auto shadow-md card-hover">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold text-muted-foreground">Guru</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Jenis</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Tanggal</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Alasan</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Memuat...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Belum ada pengajuan izin</TableCell></TableRow>
            ) : (
              rows.map((i) => (
                <TableRow key={String(i.id)}>
                  <TableCell>{String(i.guru)}</TableCell>
                  <TableCell className="capitalize">{String(i.jenis)}</TableCell>
                  <TableCell>{String(i.tanggal_mulai)} - {String(i.tanggal_selesai)}</TableCell>
                  <TableCell>{String(i.alasan) || '-'}</TableCell>
                  <TableCell>
                    <Badge className={statusColor[String(i.status)] || 'bg-gray-100 text-gray-800'}>
                      {String(i.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {String(i.status) === 'pending' && (
                      <div className="flex gap-2">
                        <Button variant="link" size="icon-sm" className="text-green-600" aria-label="Setujui izin" onClick={() => updateStatus(i.id, 'disetujui')}><CheckCircle2 className="h-4 w-4" /></Button>
                        <Button variant="link" size="icon-sm" className="text-destructive" aria-label="Tolak izin" onClick={() => updateStatus(i.id, 'ditolak')}><XCircle className="h-4 w-4" /></Button>
                      </div>
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