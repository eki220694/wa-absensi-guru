'use client';
import { useState } from 'react';

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
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Export Rekap Bulanan</h1>
      <div className="bg-white p-6 rounded-lg shadow max-w-md">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Bulan (1-12)</label>
          <input
            type="number"
            min="1"
            max="12"
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Contoh: 7"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Tahun</label>
          <input
            type="number"
            value={tahun}
            onChange={(e) => setTahun(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Contoh: 2026"
          />
        </div>
        <div className="flex gap-4">
          <a
            href={`/api/export/excel?bulan=${bulan}&tahun=${tahun}`}
            onClick={handleExcel}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-center hover:bg-green-700 transition"
          >
            Download Excel
          </a>
          <a
            href={`/api/export/pdf?bulan=${bulan}&tahun=${tahun}`}
            onClick={handlePdf}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-center hover:bg-red-700 transition"
          >
            Download PDF
          </a>
        </div>
      </div>
    </div>
  );
}