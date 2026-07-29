import { Pool } from '@neondatabase/serverless';

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const sql = async (strings: TemplateStringsArray, ...values: unknown[]) => {
  const query = strings.reduce((acc, str, i) => acc + str + (values[i] !== undefined ? `$${i + 1}` : ''), '');
  const result = await pool.query(query, values.filter(v => v !== undefined));
  return result.rows;
};
