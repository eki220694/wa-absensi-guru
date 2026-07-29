import { sql } from '../../db/connection.js';

type GuruAuth = { id: number; nama: string; jabatan: string };
const guruCache = new Map<string, GuruAuth>();

export async function checkGuru(noWa: string): Promise<GuruAuth | null> {
  const cached = guruCache.get(noWa);
  if (cached) return cached;

  const rows = await sql`
    SELECT id, nama, jabatan FROM guru WHERE no_wa = ${noWa.replace(/[^0-9]/g, '')}
  `;
  if (!rows || !rows.length) return null;
  const guru = rows[0] as unknown as GuruAuth;
  if (guru) guruCache.set(noWa, guru);
  return guru || null;
}

export async function isAdmin(noWa: string) {
  const guru = await checkGuru(noWa);
  return guru?.jabatan === 'admin';
}
