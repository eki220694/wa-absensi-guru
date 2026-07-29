import { neon } from '@neondatabase/serverless';

let _sql: ReturnType<typeof neon> | null = null;

export function sql(strings: TemplateStringsArray, ...values: unknown[]): Promise<Record<string, unknown>[]> {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!);
  return _sql(strings, ...values) as Promise<Record<string, unknown>[]>;
}
