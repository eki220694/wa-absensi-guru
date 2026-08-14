
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const a = await sql`SELECT a.id, a.tanggal, g.nama, j.hari, j.jam_ke, j.kelas, j.mapel, a.created_at, a.foto_path IS NOT NULL as foto
  FROM absen a JOIN guru g ON g.id=a.guru_id JOIN jadwal j ON j.id=a.jadwal_id
  ORDER BY a.created_at DESC LIMIT 10`;
console.log('absen terbaru:', a.length);
for (const r of a) console.log(r.id, r.tanggal, r.nama, 'hari'+r.hari, 'jam'+r.jam_ke, r.kelas, r.mapel, String(r.created_at).slice(0,19), 'foto:'+r.foto);
const t = await sql`SELECT COUNT(*)::int n FROM absen`;
console.log('total absen:', t[0].n);
