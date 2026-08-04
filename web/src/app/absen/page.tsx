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
    <div className="p-4 lg:p-8 space-y-4">
      <h1 className="text-2xl font-bold">Absen Harian</h1>
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

      <div className="rounded-lg border overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground">Memuat...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-muted-foreground">Guru</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Jam</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Kelas</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Mapel</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Foto</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Jarak</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Belum ada absen pada tanggal ini</TableCell></TableRow>
              )}
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.guru}</TableCell>
                  <TableCell>{a.jam_ke}</TableCell>
                  <TableCell>{a.kelas}</TableCell>
                  <TableCell>{a.mapel}</TableCell>
                  <TableCell>
                    <Badge className={statusColor[a.status] || 'bg-gray-100 text-gray-800'}>{a.status}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="cursor-default">
                          {a.foto_valid ? '✅' : a.foto_path ? '⚠️' : '—'}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {a.foto_valid ? 'Foto valid' : a.foto_path ? 'Foto tidak valid' : 'Tidak ada foto'}
                      </TooltipContent>
                    </Tooltip>
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