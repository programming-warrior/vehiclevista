import { sql } from 'drizzle-orm';
import { db } from "../../db";

// Replace with your actual database URL from your configuration
const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Yiek9NFhyd2c@ep-sweet-mountain-a1rw4ll7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function dropAllTables() {

  
  try {
    console.log('Starting to drop all tables and types...');
    
    // Drop tables with foreign keys first
    await db.execute(sql`DROP TABLE IF EXISTS "user_packages" CASCADE;`);
    
    // Drop all other tables
    await db.execute(sql`DROP TABLE IF EXISTS "api_keys" CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS "auctions" CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS "bulk_uploads" CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS "events" CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS "feedbacks" CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS "inventory" CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS "offers" CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS "packages" CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS "pricing_plans" CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS "role_permissions" CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS "spare_parts" CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS "users" CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS "vehicles" CASCADE;`);
    
    // Drop enum types
    await db.execute(sql`DROP TYPE IF EXISTS "public"."user_roles" CASCADE;`);
    await db.execute(sql`DROP TYPE IF EXISTS "public"."vehicle_types" CASCADE;`);
    await db.execute(sql`DROP TYPE IF EXISTS "public"."vehicle_conditions" CASCADE;`);
    await db.execute(sql`DROP TYPE IF EXISTS "public"."vehicle_listing_status" CASCADE;`);
    
    console.log('Successfully dropped all tables and types!');
    process.exit(1);
  } catch (error) {
    console.error('Error dropping tables:', error);
  }
}

// Run the function
dropAllTables();