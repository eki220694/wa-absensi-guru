"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, Sun, Moon, LogOut } from 'lucide-react';

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
  const [dark, setDark] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const saved = localStorage.getItem('theme') === 'dark';
    setDark(saved);
    document.documentElement.classList.toggle('dark', saved);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  const session = mounted && clientSession ? clientSession : serverSession;

  const NavContent = () => (
    <nav className="space-y-1 flex-1">
      {navLinks.map((l) => (
        <Link key={l.href} href={l.href}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
            pathname === l.href
              ? 'bg-primary text-primary-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          }`}
          onClick={() => setSidebarOpen(false)}>{l.label}</Link>
      ))}
    </nav>
  );

  const SidebarInner = () => (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold">SMAN 6 SIGI</h1>
          <p className="text-sm text-sidebar-foreground/70">Absensi Guru</p>
        </div>
        <Button variant="ghost" size="sm" className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setSidebarOpen(false)} aria-label="Close menu">
          <Menu className="w-5 h-5 rotate-180" />
        </Button>
      </div>
      <NavContent />
      <div className="pt-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between p-2 text-sm text-sidebar-foreground/70">
          <span className="truncate max-w-[180px]">{session.user?.name}</span>
          <Button variant="ghost" size="sm" onClick={toggleDark} aria-label="Toggle dark mode">
            {dark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 flex items-center gap-2"
          onClick={() => signOut({ callbackUrl: '/login' })}>
          <LogOut className="w-4 h-4" />
          Keluar
        </Button>
      </div>
    </>
  );

  if (!mounted) return <div className="min-h-screen bg-background">{children}</div>;
  if (!session) return <div className="min-h-screen bg-background">{children}</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile header (logged-in) */}
      <header className="lg:hidden bg-card border-b sticky top-0 z-40">
        <div className="flex items-center justify-between h-16 px-4">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} aria-label="Menu">
            <Menu className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-bold">SMAN 6 SIGI</h1>
          <Button variant="ghost" size="icon" onClick={toggleDark} aria-label="Toggle dark mode">
            {dark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground p-6 flex flex-col transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {SidebarInner()}
      </aside>

      <main className="flex-1 p-4 lg:p-6 lg:ml-0">{children}</main>
    </div>
  );
}