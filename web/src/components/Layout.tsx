"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Sun, Moon, LogOut, User, X } from "lucide-react";
import { Drawer } from "vaul";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/guru", label: "Guru" },
  { href: "/jadwal", label: "Jadwal" },
  { href: "/absen", label: "Absen" },
  { href: "/absen/export", label: "Export" },
  { href: "/izin", label: "Izin" },
  { href: "/pengaturan", label: "Pengaturan" },
];

export default function Layout({ children, session: serverSession }: { children: React.ReactNode; session: any }) {
  const pathname = usePathname();
  const { data: clientSession } = useSession();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const saved = localStorage.getItem("theme") === "dark";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [sidebarOpen]);

  const session = mounted && clientSession ? clientSession : serverSession;

  const NavContent = () => (
    <nav className="space-y-1 flex-1">
      {navLinks.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
            pathname === l.href
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-muted hover:text-foreground"
          }`}
          onClick={() => setSidebarOpen(false)}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );

  if (!mounted) return <div className="min-h-screen bg-background">{children}</div>;
  if (!session) return <div className="min-h-screen bg-background">{children}</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile header */}
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
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border p-4 flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">SMAN 6 SIGI</h1>
            <p className="text-sm text-muted-foreground">Absensi Guru</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-foreground hover:bg-muted"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <Menu className="w-5 h-5 rotate-180" />
          </Button>
        </div>
        <NavContent />
        <div className="mt-auto pt-4 border-t border-border">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session.user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{session.user?.role || "guru"}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDark}
              aria-label="Toggle dark mode"
              className="flex-1 justify-start"
            >
              {dark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              <span className="ml-2 text-sm">Tema</span>
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-destructive hover:bg-destructive/10 flex items-center gap-2 mt-2"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-6 min-h-screen">{children}</main>
    </div>
  );
}
