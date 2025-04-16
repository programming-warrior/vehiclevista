CREATE TYPE "public"."user_roles" AS ENUM('buyer', 'seller', 'admin', 'trader', 'garage');--> statement-breakpoint
CREATE TYPE "public"."vehicle_conditions" AS ENUM('clean', 'catS', 'catN');--> statement-breakpoint
CREATE TYPE "public"."vehicle_listing_status" AS ENUM('ACTIVE', 'SOLD', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."vehicle_types" AS ENUM('car', 'bike', 'truck', 'van');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"description" text NOT NULL,
	"created_at" text DEFAULT '2025-04-14T08:07:30.659Z' NOT NULL,
	"updated_at" text DEFAULT '2025-04-14T08:07:30.659Z' NOT NULL,
	CONSTRAINT "api_keys_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "auctions" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"starting_price" real NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"vehicle_id" integer NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"current_bid" real DEFAULT 0,
	"total_bids" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bulk_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"status" text NOT NULL,
	"file_name" text NOT NULL,
	"total_vehicles" integer,
	"processed_vehicles" integer DEFAULT 0,
	"errors" jsonb[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"event_type" text NOT NULL,
	"date" timestamp NOT NULL,
	"location" text NOT NULL,
	"capacity" integer NOT NULL,
	"registered_count" integer DEFAULT 0,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feedbacks" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"category" text NOT NULL,
	"priority" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"submitted_by" text NOT NULL,
	"submitted_at" timestamp DEFAULT now(),
	"resolved_at" timestamp,
	"resolution" text
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sku" text NOT NULL,
	"category" text NOT NULL,
	"quantity" integer NOT NULL,
	"price" real NOT NULL,
	"cost" real NOT NULL,
	"supplier" text,
	"location" text NOT NULL,
	"status" text DEFAULT 'in-stock' NOT NULL,
	"description" text NOT NULL,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"offer_type" text NOT NULL,
	"discount" real NOT NULL,
	"discount_type" text NOT NULL,
	"min_purchase" real,
	"valid_from" timestamp NOT NULL,
	"valid_to" timestamp NOT NULL,
	"applicable_items" text[],
	"terms_conditions" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"redemptions" integer DEFAULT 0,
	"max_redemptions" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"base_price" integer NOT NULL,
	"vehicle_value_thresholds" jsonb NOT NULL,
	"duration" integer NOT NULL,
	"features" jsonb[] NOT NULL,
	"is_ultra" boolean DEFAULT false,
	"relisting_period" integer,
	"youtube_showcase" boolean DEFAULT false,
	"premium_placement" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pricing_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" real NOT NULL,
	"billing_cycle" text NOT NULL,
	"features" text[] NOT NULL,
	"max_listings" integer NOT NULL,
	"max_images" integer NOT NULL,
	"priority_support" boolean DEFAULT false,
	"featured_listings" integer DEFAULT 0,
	"status" text DEFAULT 'draft' NOT NULL,
	"trial_days" integer DEFAULT 0,
	"subscriptions" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"resource" text NOT NULL,
	"can_create" boolean DEFAULT false NOT NULL,
	"can_read" boolean DEFAULT true NOT NULL,
	"can_update" boolean DEFAULT false NOT NULL,
	"can_delete" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spare_parts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"part_number" text NOT NULL,
	"manufacturer" text NOT NULL,
	"category" text NOT NULL,
	"compatible_models" text[],
	"price" real NOT NULL,
	"stock_level" integer NOT NULL,
	"min_stock_level" integer NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"location" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"package_id" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"vehicle_value" integer NOT NULL,
	"final_price" integer NOT NULL,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"role" "user_roles" DEFAULT 'buyer' NOT NULL,
	"created_at" text DEFAULT '2025-04-14T08:07:30.652Z' NOT NULL,
	"business_name" text,
	"business_address" text,
	"package_type" text,
	"package_expires_at" timestamp,
	"monthly_allowance" integer,
	"used_allowance" integer DEFAULT 0,
	"performance_tracking" jsonb DEFAULT '{}',
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "vehicle_types" DEFAULT 'car' NOT NULL,
	"registration_num" text NOT NULL,
	"title" text NOT NULL,
	"price" integer NOT NULL,
	"year" integer NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"mileage" integer NOT NULL,
	"fuel_type" text NOT NULL,
	"transmission" text NOT NULL,
	"body_type" text NOT NULL,
	"color" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"images" text[] NOT NULL,
	"category" text NOT NULL,
	"condition" "vehicle_conditions" DEFAULT 'clean' NOT NULL,
	"open_to_px" boolean DEFAULT false,
	"seller_id" integer NOT NULL,
	"seller_type" text,
	"contact_preference" text,
	"listingStatus" "vehicle_listing_status" DEFAULT 'ACTIVE' NOT NULL,
	"negotiable" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"views" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"leads" integer DEFAULT 0,
	CONSTRAINT "vehicles_registration_num_unique" UNIQUE("registration_num")
);
--> statement-breakpoint
ALTER TABLE "user_packages" ADD CONSTRAINT "user_packages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_packages" ADD CONSTRAINT "user_packages_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE no action ON UPDATE no action;