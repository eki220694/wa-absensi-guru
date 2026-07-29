import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AuthProvider from '@/components/AuthProvider';

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <div className="flex min-h-screen">
            <aside className="w-64 bg-slate-800 text-white p-6 flex flex-col">
              <div>
                <h1 className="text-xl font-bold mb-8">SMAN 6 SIGI</h1>
                <p className="text-sm text-slate-400 mb-6">Absensi Guru</p>
                <nav className="space-y-2">
                  {navLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="block px-3 py-2 rounded hover:bg-slate-700 transition"
                    >
                      {l.label}
                    </Link>
                  ))}
                </nav>
              </div>
              {session?.user && (
                <div className="mt-auto pt-4 border-t border-slate-600">
                  <p className="text-sm text-slate-300 mb-2 truncate">{session.user.name}</p>
                  <form action="/api/auth/signout" method="POST">
                    <button
                      type="submit"
                      className="w-full text-left px-3 py-2 rounded hover:bg-red-700 transition text-sm cursor-pointer"
                    >
                      Keluar
                    </button>
                  </form>
                </div>
              )}
            </aside>
            <main className="flex-1 bg-gray-50">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
