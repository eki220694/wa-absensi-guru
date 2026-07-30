import type { Metadata } from 'next';
import './globals.css';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AuthProvider from '@/components/AuthProvider';
import Layout from '@/components/Layout';

export const metadata: Metadata = {
  title: 'SMAN 6 SIGI - Absensi Guru',
  description: 'Dashboard Absensi Guru SMAN 6 SIGI',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <Layout session={session}>
            {children}
          </Layout>
        </AuthProvider>
      </body>
    </html>
  );
}