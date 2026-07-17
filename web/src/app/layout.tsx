import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SMAN 6 SIGI - Absensi Guru',
  description: 'Dashboard Absensi Guru SMAN 6 SIGI',
};

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/guru', label: 'Guru' },
  { href: '/jadwal', label: 'Jadwal' },
  { href: '/absen', label: 'Absen' },
  { href: '/absen/export', label: 'Export' },
  { href: '/izin', label: 'Izin' },
  { href: '/pengaturan', label: 'Pengaturan' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <div className="flex min-h-screen">
          <aside className="w-64 bg-slate-800 text-white p-6">
            <h1 className="text-xl font-bold mb-8">SMAN 6 SIGI</h1>
            <p className="text-sm text-slate-400 mb-6">Absensi Guru</p>
            <nav className="space-y-2">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="block px-3 py-2 rounded hover:bg-slate-700 transition"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          </aside>
          <main className="flex-1 bg-gray-50">{children}</main>
        </div>
      </body>
    </html>
  );
}
