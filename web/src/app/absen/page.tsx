'use client';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const dynamic = 'force-dynamic';


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
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = async (t: string, g: string) => {
    setLoading(true);
    const params = new URLSearchParams({ tanggal: t });
    if (g) params.set('guru_id', g);
    const [absenRes, guruRes] = await Promise.all([
      fetch(`/api/absen?${params}`),
      fetch('/api/guru'),
    ]);
    const absenData = await absenRes.json();
    setRows(Array.isArray(absenData) ? absenData : []);
    setGuruList(await guruRes.json());
    setLoading(false);
    setLastUpdated(new Date().toLocaleTimeString('id-ID'));
  };

  useEffect(() => { fetchData(tanggal, guruId); }, [tanggal, guruId]);

  const handleTanggalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTanggal(e.target.value);
    fetchData(e.target.value, guruId);
  };
  const handleGuruChange = (v: string) => {
    setGuruId(v);
    fetchData(tanggal, v);
  };

  const statusColor: Record<string, string> = {
    hadir: 'bg-green-100 text-green-800',
    terlambat: 'bg-yellow-100 text-yellow-800',
    tidak_hadir: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 stagger-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 font-bold tracking-tight">Absen Harian</h1>
        </div>
      </div>
      {lastUpdated && <p className="text-xs text-muted-foreground">🔄 Auto-refresh 15 detik · Terakhir diperbarui {lastUpdated}</p>}

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label>Tanggal</Label>
          <Input type="date" value={tanggal} onChange={handleTanggalChange} />
        </div>
        <div className="space-y-1">
          <Label>Filter Guru</Label>
          <Select value={guruId} onValueChange={(v) => handleGuruChange(v ?? '')}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Semua Guru" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Guru</SelectItem>
              {guruList.map((g) => (
                <SelectItem key={g.id} value={String(g.id)}>{g.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden e-2">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground">Memuat...</div>
        ) : (
          <Table density="compact">
            <TableHeader>
              <TableRow>
                <TableHead>Guru</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Mapel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Foto</TableHead>
                <TableHead>Jarak</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Belum ada absen pada tanggal ini</TableCell></TableRow>
              )}
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.guru}</TableCell>
                  <TableCell><span className="font-mono">{a.jam_ke}</span></TableCell>
                  <TableCell>{a.kelas}</TableCell>
                  <TableCell>{a.mapel}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === 'hadir' ? 'success' : a.status === 'terlambat' ? 'warning' : 'danger'}>
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {a.foto_path ? (
                      <a href={`/api/absen/foto?id=${a.id}`} target="_blank" rel="noreferrer"
                         title={a.foto_valid ? 'Foto valid (klik untuk perbesar)' : 'Foto tidak valid (klik untuk perbesar)'}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/absen/foto?id=${a.id}`} alt="foto absen"
                             className="inline-block h-10 w-10 rounded-md object-cover ring-1 ring-border" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{a.jarak_meter !== null ? `${a.jarak_meter.toFixed(1)} m` : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}