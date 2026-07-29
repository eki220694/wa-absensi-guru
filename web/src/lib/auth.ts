import { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { sql } from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        nip: { label: 'NIP', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.nip || !credentials?.password) return null;

        const [guru] = await sql`
          SELECT id, nip, nama, jabatan, password_hash FROM guru WHERE nip = ${credentials.nip}
        `;

        if (!guru || !guru.password_hash) return null;

        const valid = await bcrypt.compare(credentials.password, guru.password_hash as string);
        if (!valid) return null;

        return { id: String(guru.id), name: guru.nama as string, email: guru.nip as string, role: guru.jabatan as string };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
};
