import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AuthProvider from "@/components/AuthProvider";
import Layout from "@/components/Layout";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
// import { CommandPalette } from "@/components/CommandPalette";

export const dynamic = "force-dynamic";

const geistSans = localFont({
  src: [
    { path: "../../../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2", weight: "100 900", style: "normal" },
    { path: "../../../node_modules/geist/dist/fonts/geist-sans/Geist-Italic[wght].woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = localFont({
  src: [
    { path: "../../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SMAN 6 SIGI - Absensi Guru",
  description: "Dashboard Absensi Guru SMAN 6 SIGI",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="id" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
      <body suppressHydrationWarning className="antialiased">
        <TooltipProvider delay={0}>
          <AuthProvider>
            <Layout session={session}>{children}</Layout>
          </AuthProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast: "bg-popover text-popover-foreground border border-border",
                description: "text-muted-foreground",
                actionButton: "bg-primary text-primary-foreground",
                closeButton: "text-muted-foreground",
              },
            }}
          />
          {/* <CommandPalette /> */}
        </TooltipProvider>
      </body>
    </html>
  );
}
