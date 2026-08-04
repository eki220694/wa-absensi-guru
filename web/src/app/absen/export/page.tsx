'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function ExportPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(String(now.getMonth() + 1));
  const [tahun, setTahun] = useState(String(now.getFullYear()));
  const [downloading, setDownloading] = useState<'excel' | 'pdf' | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const download = async (type: 'excel' | 'pdf') => {
    if (!bulan || !tahun) {
      alert('Isi bulan dan tahun terlebih dahulu');
      return;
    }
    setDownloading(type);
    setMsg(null);
    try {
      const res = await fetch(`/api/export/${type}?bulan=${bulan}&tahun=${tahun}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let msg = `Export gagal (${res.status})`;
        try { msg = JSON.parse(text).error || msg; } catch { msg = text || msg; }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ext = type === 'excel' ? 'xlsx' : 'pdf';
      const pad = String(bulan).padStart(2, '0');
      a.href = url;
      a.download = `rekap-absensi-${tahun}-${pad}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      setMsg(err?.message || 'Export gagal');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 stagger-in">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Export Rekap Bulanan</h1>
      </div>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Unduh Rekap Absensi</CardTitle>
          <CardDescription>Pilih bulan dan tahun untuk mengekspor data absensi guru</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Bulan (1-12)</Label>
            <Input
              type="number"
              min="1"
              max="12"
              value={bulan}
              onChange={e => setBulan(e.target.value)}
              placeholder="Contoh: 7"
            />
          </div>
          <div className="space-y-1">
            <Label>Tahun</Label>
            <Input
              type="number"
              value={tahun}
              onChange={e => setTahun(e.target.value)}
              placeholder="Contoh: 2026"
            />
          </div>
          <div className="flex gap-4">
            <Button
              variant="default"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={downloading !== null}
              onClick={() => download('excel')}
            >
              {downloading === 'excel' ? 'Mengunduh...' : 'Download Excel'}
            </Button>
            <Button
              variant="default"
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={downloading !== null}
              onClick={() => download('pdf')}
            >
              {downloading === 'pdf' ? 'Mengunduh...' : 'Download PDF'}
            </Button>
          </div>
          {msg && (
            <Alert variant="destructive">
              <AlertTitle>Perhatian</AlertTitle>
              <AlertDescription>{msg}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
