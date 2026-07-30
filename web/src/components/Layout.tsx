"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/guru', label: 'Guru' },
  { href: '/jadwal', label: 'Jadwal' },
  { href: '/absen', label: 'Absen' },
  { href: '/absen/export', label: 'Export' },
  { href: '/izin', label: 'Izin' },
  { href: '/pengaturan', label: 'Pengaturan' },
];

export default function Layout({ children, session: serverSession }: { children: React.ReactNode; session: any }) {
  const pathname = usePathname();
  const { data: clientSession } = useSession();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const session = mounted && clientSession ? clientSession : serverSession;

  if (!mounted) {
    // Server render: match what client will show
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  if (!session) return <div className="min-h-screen bg-gray-50">{children}</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="lg:hidden bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between h-16 px-4">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-slate-800">SMAN 6 SIGI</h1>
          <div className="w-10" />
        </div>
      </header>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-800 text-white p-6 flex flex-col transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-bold">SMAN 6 SIGI</h1>
              <p className="text-sm text-slate-400">Absensi Guru</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-slate-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <nav className="space-y-1 flex-1">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href}
                className={`block px-3 py-2 rounded-lg transition ${pathname === l.href ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-700 hover:text-white'}`}
                onClick={() => setSidebarOpen(false)}>{l.label}</Link>
            ))}
          </nav>
          <div className="pt-4 border-t border-slate-600">
            <p className="text-sm text-slate-300 mb-2 truncate">{session.user?.name}</p>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-700 transition text-sm cursor-pointer">Keluar</button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-0 flex-1 p-4 lg:p-6">{children}</main>
    </div>
  );
}