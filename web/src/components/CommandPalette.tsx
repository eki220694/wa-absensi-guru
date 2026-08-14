"use client";

import { useState, useEffect } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Users, CalendarDays, ClipboardList, FileBarChart, Settings,
  LayoutDashboard, Clock, LogOut, Search,
} from "lucide-react";
import { signOut } from "next-auth/react";

const commands = [
  { group: "Navigasi", items: [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Guru", href: "/guru", icon: Users },
    { label: "Jadwal", href: "/jadwal", icon: CalendarDays },
    { label: "Absen", href: "/absen", icon: ClipboardList },
    { label: "Izin", href: "/izin", icon: Clock },
    { label: "Export", href: "/absen/export", icon: FileBarChart },
    { label: "Pengaturan", href: "/pengaturan", icon: Settings },
  ]},
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const run = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <Command className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Command.Input
              placeholder="Cari halaman atau tindakan..."
              className="h-11 w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
            <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              Tidak ada hasil.
            </Command.Empty>
            {commands.map((group) => (
              <Command.Group key={group.group} heading={group.group}>
                {group.items.map((item) => (
                  <Command.Item
                    key={item.href}
                    onSelect={() => run(item.href)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted data-[selected=true]:bg-muted"
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{item.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
            <Command.Group heading="Tindakan">
              <Command.Item
                onSelect={() => { setOpen(false); signOut({ callbackUrl: "/login" }); }}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 data-[selected=true]:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
