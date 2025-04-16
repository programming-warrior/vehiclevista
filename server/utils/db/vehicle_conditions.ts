import { sql } from "drizzle-orm";
import { db } from "../../db";

export async function up() {
  // Create enums if they don't exist
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE vehicle_conditions AS ENUM ('clean', 'catS', 'catN');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE vehicle_listing_status AS ENUM ('ACTIVE', 'SOLD', 'EXPIRED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Add temporary columns
  await db.execute(sql`ALTER TABLE vehicles ADD COLUMN condition_new vehicle_conditions`);
  await db.execute(sql`ALTER TABLE vehicles ADD COLUMN listing_status_new vehicle_listing_status`);

  // Convert existing data
  await db.execute(sql`
    UPDATE vehicles 
    SET condition_new = condition::vehicle_conditions,
        listing_status_new = listing_status::vehicle_listing_status
  `);

  // Drop old columns and rename new ones
  await db.execute(sql`
    ALTER TABLE vehicles 
    DROP COLUMN condition,
    DROP COLUMN listing_status,
    RENAME COLUMN condition_new TO condition,
    RENAME COLUMN listing_status_new TO listing_status
  `);

  // Set NOT NULL constraints and defaults
  await db.execute(sql`
    ALTER TABLE vehicles 
    ALTER COLUMN condition SET NOT NULL,
    ALTER COLUMN condition SET DEFAULT 'clean'::vehicle_conditions,
    ALTER COLUMN listing_status SET NOT NULL,
    ALTER COLUMN listing_status SET DEFAULT 'ACTIVE'::vehicle_listing_status
  `);
}

up().catch((error) => {
  console.error("Migration failed:", error);       
    process.exit(1);
});

export async function down() {
  // Revert changes if needed
  await db.execute(sql`
    ALTER TABLE vehicles 
    ALTER COLUMN condition TYPE text,
    ALTER COLUMN listing_status TYPE text
  `);

  await db.execute(sql`DROP TYPE IF EXISTS vehicle_conditions`);
  await db.execute(sql`DROP TYPE IF EXISTS vehicle_listing_status`);
}