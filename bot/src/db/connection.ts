import { neon, neonConfig } from '@neondatabase/serverless';

if (process.env.DATABASE_URL) {
  neonConfig.poolQueryTimout = 5000;
}

export const sql = neon(process.env.DATABASE_URL!);
