import { startBot } from './bot/connection.js';
import { sql } from './db/connection.js';

// Test DB connection on startup
async function main() {
  try {
    await sql`SELECT 1`;
    console.log('Database connected');
  } catch (err) {
    console.error('DB connection failed:', err);
    process.exit(1);
  }

  await startBot();
  console.log('Bot started');
}

main().catch(console.error);
