import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";
import dotenv from "dotenv";
dotenv.config();

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with proper settings and SSL
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false // Required for some cloud databases
  }
};

export const pool = new Pool(poolConfig);

// Add connection error handler
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection on startup with detailed error logging
async function testConnection() {
  let client;
  try {
    client = await pool.connect();

    // Test query to verify database connection and schema
    const testResult = await client.query('SELECT table_name FROM information_schema.tables WHERE table_schema = $1', ['public']);
    console.log('Available tables:', testResult.rows.map(row => row.table_name));

    console.log('Database connection successful');
    return true;
  } catch (err) {
    console.error('Database connection error:', err);
    console.error('Connection details:', {
      host: process.env.PGHOST,
      port: process.env.PGPORT,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      // Don't log password
    });
    throw err;
  } finally {
    if (client) client.release();
  }
}

// Initialize connection test with proper error handling
testConnection().catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

export const db = drizzle(pool, { schema });

// Export a function to check database health
export async function checkDatabaseHealth() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT 1');
    client.release();
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}