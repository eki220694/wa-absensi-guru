'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PengaturanPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [edit, setEdit] = useState<string | null>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    fetch('/api/pengaturan?raw=1').then(r => r.json()).then((rows: any[]) => {
      const obj: Record<string, string> = {};
      rows.forEach((r: any) => { obj[r.key] = r.value; });
      setConfig(obj);
    });
  }, []);

  const simpan = async (key: string) => {
    const res = await fetch('/api/pengaturan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    if (res.ok) { setConfig({ ...config, [key]: value }); setEdit(null); }
    else alert((await res.json()).error);
  };

  const labelMap: Record<string, string> = {
    latitude_sekolah: 'Latitude Sekolah',
    longitude_sekolah: 'Longitude Sekolah',
    radius_absen: 'Radius Absen (meter)',
    jam_mulai: 'Jam Mulai Sekolah',
    jam_selesai: 'Jam Selesai Sekolah',
  };

  return (
    <div className="p-4 lg:p-8 space-y-4">
      <h1 className="text-2xl font-bold">Pengaturan</h1>
      <Card className="max-w-xl">
        <CardContent className="p-0">
          {Object.entries(config).map(([key, val]) => (
            <div key={key} className="border-t first:border-t-0 p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">{labelMap[key] || key}</p>
                {edit === key ? (
                  <div className="flex gap-2 mt-1">
                    <Input type="text" value={value} onChange={e => setValue(e.target.value)} className="flex-1" autoFocus />
                    <Button size="sm" onClick={() => simpan(key)}>Simpan</Button>
                    <Button size="sm" variant="outline" onClick={() => setEdit(null)}>Batal</Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-0.5">{val}</p>
                )}
              </div>
              {edit !== key && (
                <Button variant="link" size="sm" className="whitespace-nowrap ml-4" onClick={() => { setEdit(key); setValue(val); }}>
                  Ubah
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}