import { sql } from '../../db/connection.js';

const guruCache = new Map<string, { id: number; nama: string; jabatan: string }>();

export async function checkGuru(noWa: string) {
  const cached = guruCache.get(noWa);
  if (cached) return cached;

  const [guru] = await sql`
    SELECT id, nama, jabatan FROM guru WHERE no_wa = ${noWa.replace(/[^0-9]/g, '')}
  `;
  if (guru) guruCache.set(noWa, guru);
  return guru || null;
}

export async function isAdmin(noWa: string) {
  const guru = await checkGuru(noWa);
  return guru?.jabatan === 'admin';
}
