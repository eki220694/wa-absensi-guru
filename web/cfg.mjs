
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const c = await sql`SELECT key, value FROM config ORDER BY key`;
for (const r of c) console.log(r.key, '=', r.value);
