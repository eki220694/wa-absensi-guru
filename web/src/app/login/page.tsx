'use client';
import { signIn, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Lock, Building2, Shield } from 'lucide-react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') router.push('/');
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const result = await signIn('credentials', { nip, password, redirect: false });
    if (result?.error) { setError('NIP atau password salah'); setLoading(false); }
    else router.push('/');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4">
      {/* Subtle background grid pattern */}
      <div className="absolute inset-0 opacity-5" aria-hidden="true">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)"/>
        </svg>
      </div>

      {/* Glow behind card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[420px] rounded-2xl bg-primary/10 blur-3xl animate-pulse" aria-hidden="true" />

      <Card className="relative z-10 w-full max-w-sm overflow-hidden border-border/50 shadow-2xl animate-scale-in">
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/60 to-primary" />

        <CardHeader className="text-center pb-2">
          {/* School emblem */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">SMAN 6 SIGI</CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Sistem Absensi Guru — Admin Panel
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && (
            <Alert variant="destructive" className="mb-2">
              <AlertDescription className="flex items-center gap-2">
                <Shield className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nip" className="text-sm font-medium text-foreground">
                NIP
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" aria-hidden="true" />
                <Input
                  id="nip"
                  type="text"
                  value={nip}
                  onChange={e => setNip(e.target.value)}
                  placeholder="Masukkan NIP"
                  required
                  disabled={loading}
                  className="pl-10"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" aria-hidden="true" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  disabled={loading}
                  className="pl-10"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 text-base font-medium">
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          {/* Divider with text */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs text-muted-foreground">
              <span className="bg-card px-3">Pengaturan Sekolah</span>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div>
              <dt className="font-medium text-foreground">Latitude</dt>
              <dd>−1.1356828°</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Longitude</dt>
              <dd>120.0642654°</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Radius</dt>
              <dd>100 meter</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Zona Waktu</dt>
              <dd>WITA (UTC+8)</dd>
            </div>
          </dl>
        </CardContent>

        {/* Footer */}
        <div className="border-t border-border/50 p-4 text-center text-xs text-muted-foreground">
          <p>Sistem Manajemen Absensi Digital</p>
          <p className="mt-0.5">SMAN 6 SIGI · Kabupaten Sigi, Sulawesi Tengah</p>
        </div>
      </Card>
    </div>
  );
}