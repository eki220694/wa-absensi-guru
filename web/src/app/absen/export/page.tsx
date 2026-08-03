'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ExportPage() {
  const [bulan, setBulan] = useState('');
  const [tahun, setTahun] = useState('');

  const handleExcel = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!bulan || !tahun) {
      e.preventDefault();
      alert('Isi bulan dan tahun terlebih dahulu');
    }
  };

  const handlePdf = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!bulan || !tahun) {
      e.preventDefault();
      alert('Isi bulan dan tahun terlebih dahulu');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-4">
      <h1 className="text-2xl font-bold">Export Rekap Bulanan</h1>
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
            <a
              href={`/api/export/excel?bulan=${bulan}&tahun=${tahun}`}
              onClick={handleExcel}
              className="flex-1 inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2.5 text-white text-sm font-medium transition hover:bg-green-700"
            >
              Download Excel
            </a>
            <a
              href={`/api/export/pdf?bulan=${bulan}&tahun=${tahun}`}
              onClick={handlePdf}
              className="flex-1 inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-white text-sm font-medium transition hover:bg-red-700"
            >
              Download PDF
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}