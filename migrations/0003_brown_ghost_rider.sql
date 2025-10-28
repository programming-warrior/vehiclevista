CREATE TYPE "public"."auction_status" AS ENUM('RUNNING', 'NEED_APPROVAL', 'BLACKLISTED', 'UPCOMING', 'SOLD', 'ENDED');--> statement-breakpoint
CREATE TYPE "public"."created_by" AS ENUM('admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'blacklisted', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."trader_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
ALTER TYPE "public"."vehicle_conditions" ADD VALUE 'catA';--> statement-breakpoint
ALTER TYPE "public"."vehicle_conditions" ADD VALUE 'catB';--> statement-breakpoint
ALTER TYPE "public"."vehicle_listing_status" ADD VALUE 'NEED_APPROVAL' BEFORE 'SOLD';--> statement-breakpoint
ALTER TYPE "public"."vehicle_listing_status" ADD VALUE 'BLACKLISTED' BEFORE 'SOLD';--> statement-breakpoint
CREATE TABLE "admin_ip_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"ip_address" text NOT NULL,
	"location_city" text,
	"location_country" text,
	"device_browser" text,
	"device_os" text,
	"user_agent_raw" text,
	"session_duration" integer,
	"status" text DEFAULT 'failed' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "auction_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"starting_price" real NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"item_id" integer,
	"item_type" text DEFAULT 'VEHICLE' NOT NULL,
	"seller_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "auction_favourites" (
	"id" serial PRIMARY KEY NOT NULL,
	"auction_id" integer,
	"user_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "auction_metrics_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" integer NOT NULL,
	"views" integer NOT NULL,
	"clicks" integer NOT NULL,
	"leads" integer NOT NULL,
	"recorded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "auction_winner" (
	"id" serial PRIMARY KEY NOT NULL,
	"bid_amount" real NOT NULL,
	"username" text NOT NULL,
	"userEmail" text NOT NULL,
	"user_id" integer NOT NULL,
	"auction_id" integer NOT NULL,
	"bid_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bids" (
	"id" serial PRIMARY KEY NOT NULL,
	"bid_amount" real NOT NULL,
	"user_id" integer NOT NULL,
	"auction_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blacklist_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" text DEFAULT '2025-10-28T13:12:34.747Z' NOT NULL,
	"reason" text NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"createdBy" "created_by" DEFAULT 'admin' NOT NULL,
	"created_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" integer NOT NULL,
	"seller_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"contact_method" text,
	"message" text NOT NULL,
	"delivery_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "listing_report" (
	"id" serial PRIMARY KEY NOT NULL,
	"reported_vehicle" integer,
	"reported_auction" integer,
	"reported_by" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"status" text DEFAULT 'pending' NOT NULL,
	"resolved_at" timestamp,
	"resolution" text
);
--> statement-breakpoint
CREATE TABLE "make" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"entries" integer DEFAULT 0 NOT NULL,
	"searched" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "make_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "model" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"makeId" integer NOT NULL,
	"entries" integer DEFAULT 0 NOT NULL,
	"searched" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "model_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"sent_to" integer NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"message" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "number_plate" (
	"id" serial PRIMARY KEY NOT NULL,
	"plate_number" text NOT NULL,
	"document_url" text[] NOT NULL,
	"plate_value" real NOT NULL,
	"seller_id" integer,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_session" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"package_id" integer,
	"draft_id" integer,
	"listing_id" integer,
	"amount" real NOT NULL,
	"currency" text DEFAULT 'gbp' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"payment_intent_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "payment_session_payment_intent_id_unique" UNIQUE("payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "platform_summary_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"recorded_at" timestamp NOT NULL,
	"total_vehicles" integer DEFAULT 0 NOT NULL,
	"total_auctions" integer DEFAULT 0 NOT NULL,
	"total_users" integer DEFAULT 0 NOT NULL,
	"total_vehicle_views" integer DEFAULT 0 NOT NULL,
	"total_vehicle_clicks" integer DEFAULT 0 NOT NULL,
	"total_vehicle_leads" integer DEFAULT 0 NOT NULL,
	"total_auction_views" integer DEFAULT 0 NOT NULL,
	"total_auction_clicks" integer DEFAULT 0 NOT NULL,
	"total_auction_leads" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raffle" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "vehicle_types" DEFAULT 'car' NOT NULL,
	"registration_num" text NOT NULL,
	"price" integer NOT NULL,
	"year" integer NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"mileage" integer NOT NULL,
	"fuel_type" text NOT NULL,
	"transmission" text NOT NULL,
	"body_type" text NOT NULL,
	"color" text NOT NULL,
	"location" text NOT NULL,
	"images" text[] NOT NULL,
	"condition" "vehicle_conditions" DEFAULT 'clean' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"ticket_price" real NOT NULL,
	"ticket_quantity" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"featured" boolean DEFAULT true NOT NULL,
	"sold_ticket" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'UPCOMING' NOT NULL,
	"winner" integer,
	"created_at" timestamp DEFAULT now(),
	"views" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"leads" integer DEFAULT 0,
	CONSTRAINT "raffle_registration_num_unique" UNIQUE("registration_num")
);
--> statement-breakpoint
CREATE TABLE "raffle_ticket_sale" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_qtn" integer NOT NULL,
	"user_id" integer NOT NULL,
	"raffle_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recent_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"classified_id" integer,
	"auction_id" integer,
	"user_id" integer,
	"viewsAt" timestamp DEFAULT now(),
	CONSTRAINT "recent_views_classified_id_user_id_unique" UNIQUE("classified_id","user_id"),
	CONSTRAINT "recent_views_auction_id_user_id_unique" UNIQUE("auction_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "system_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_auction_visible" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trader_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"uk_company_name" text NOT NULL,
	"uk_company_number" text NOT NULL,
	"status" "trader_request_status" DEFAULT 'PENDING' NOT NULL,
	"submitted_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"reviewed_by" integer,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_listing_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"package_id" integer NOT NULL,
	"listing_id" integer NOT NULL,
	"purchased_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"vehicle_value" real NOT NULL,
	"price_paid" real NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "user_offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"offer_id" integer NOT NULL,
	"redeemed" boolean DEFAULT false,
	"redeemed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_report" (
	"id" serial PRIMARY KEY NOT NULL,
	"reported_by" integer NOT NULL,
	"reported_for" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"status" text DEFAULT 'pending' NOT NULL,
	"resolved_at" timestamp,
	"resolution" text
);
--> statement-breakpoint
CREATE TABLE "vehicle_drafts" (
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
	"latitude" real,
	"longitude" real,
	"others" json DEFAULT 'null'::json,
	"engine" json DEFAULT 'null'::json,
	"images" text[] NOT NULL,
	"category" text,
	"condition" "vehicle_conditions" DEFAULT 'clean' NOT NULL,
	"open_to_px" boolean DEFAULT false,
	"seller_id" integer NOT NULL,
	"seller_type" text,
	"contact_preference" text,
	"listingStatus" "vehicle_listing_status" DEFAULT 'ACTIVE' NOT NULL,
	"listing_type" text DEFAULT 'CLASSIFIED',
	"reason" text,
	"negotiable" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "vehicle_drafts_registration_num_unique" UNIQUE("registration_num")
);
--> statement-breakpoint
CREATE TABLE "vehicle_favourite" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" integer,
	"user_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "vehicle_favourite_vehicle_id_user_id_unique" UNIQUE("vehicle_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "vehicle_metrics_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" integer NOT NULL,
	"views" integer NOT NULL,
	"clicks" integer NOT NULL,
	"leads" integer NOT NULL,
	"recorded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_packages" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "user_packages" CASCADE;--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "created_at" SET DEFAULT '2025-10-28T13:12:34.748Z';--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "updated_at" SET DEFAULT '2025-10-28T13:12:34.748Z';--> statement-breakpoint
ALTER TABLE "auctions" ALTER COLUMN "status" SET DATA TYPE auction_status;--> statement-breakpoint
ALTER TABLE "auctions" ALTER COLUMN "status" SET DEFAULT 'UPCOMING';--> statement-breakpoint
ALTER TABLE "offers" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT '2025-10-28T13:12:34.706Z';--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "category" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auctions" ADD COLUMN "item_type" text DEFAULT 'VEHICLE' NOT NULL;--> statement-breakpoint
ALTER TABLE "auctions" ADD COLUMN "item_id" integer;--> statement-breakpoint
ALTER TABLE "auctions" ADD COLUMN "seller_id" integer;--> statement-breakpoint
ALTER TABLE "auctions" ADD COLUMN "blacklistReason" text;--> statement-breakpoint
ALTER TABLE "auctions" ADD COLUMN "views" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "auctions" ADD COLUMN "clicks" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "auctions" ADD COLUMN "leads" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "conditions" text NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "discount_value" real NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "start_date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "end_date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "packages_id" integer;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "joining_dependent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "joining_first_months" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "prices" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "duration_days" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "is_until_sold" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "is_rebookable" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "rebookable_days" integer;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auth_provider" text DEFAULT 'local' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" "status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "card" jsonb DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "listing_type" text DEFAULT 'CLASSIFIED';--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "others" json DEFAULT 'null'::json;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "engine" json DEFAULT 'null'::json;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "admin_ip_logs" ADD CONSTRAINT "admin_ip_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction_drafts" ADD CONSTRAINT "auction_drafts_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction_favourites" ADD CONSTRAINT "auction_favourites_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction_favourites" ADD CONSTRAINT "auction_favourites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction_metrics_history" ADD CONSTRAINT "auction_metrics_history_vehicle_id_auctions_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."auctions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction_winner" ADD CONSTRAINT "auction_winner_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction_winner" ADD CONSTRAINT "auction_winner_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction_winner" ADD CONSTRAINT "auction_winner_bid_id_bids_id_fk" FOREIGN KEY ("bid_id") REFERENCES "public"."bids"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklist_users" ADD CONSTRAINT "blacklist_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklist_users" ADD CONSTRAINT "blacklist_users_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_attempts" ADD CONSTRAINT "contact_attempts_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_attempts" ADD CONSTRAINT "contact_attempts_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_attempts" ADD CONSTRAINT "contact_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_report" ADD CONSTRAINT "listing_report_reported_vehicle_vehicles_id_fk" FOREIGN KEY ("reported_vehicle") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_report" ADD CONSTRAINT "listing_report_reported_auction_auctions_id_fk" FOREIGN KEY ("reported_auction") REFERENCES "public"."auctions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_report" ADD CONSTRAINT "listing_report_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model" ADD CONSTRAINT "model_makeId_make_id_fk" FOREIGN KEY ("makeId") REFERENCES "public"."make"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sent_to_users_id_fk" FOREIGN KEY ("sent_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "number_plate" ADD CONSTRAINT "number_plate_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_session" ADD CONSTRAINT "payment_session_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raffle" ADD CONSTRAINT "raffle_winner_users_id_fk" FOREIGN KEY ("winner") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raffle_ticket_sale" ADD CONSTRAINT "raffle_ticket_sale_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raffle_ticket_sale" ADD CONSTRAINT "raffle_ticket_sale_raffle_id_raffle_id_fk" FOREIGN KEY ("raffle_id") REFERENCES "public"."raffle"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recent_views" ADD CONSTRAINT "recent_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trader_requests" ADD CONSTRAINT "trader_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trader_requests" ADD CONSTRAINT "trader_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_listing_packages" ADD CONSTRAINT "user_listing_packages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_listing_packages" ADD CONSTRAINT "user_listing_packages_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_offers" ADD CONSTRAINT "user_offers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_offers" ADD CONSTRAINT "user_offers_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_report" ADD CONSTRAINT "user_report_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_report" ADD CONSTRAINT "user_report_reported_for_users_id_fk" FOREIGN KEY ("reported_for") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_favourite" ADD CONSTRAINT "vehicle_favourite_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_favourite" ADD CONSTRAINT "vehicle_favourite_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_metrics_history" ADD CONSTRAINT "vehicle_metrics_history_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auctions" DROP COLUMN "vehicle_id";--> statement-breakpoint
ALTER TABLE "offers" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "offers" DROP COLUMN "offer_type";--> statement-breakpoint
ALTER TABLE "offers" DROP COLUMN "discount";--> statement-breakpoint
ALTER TABLE "offers" DROP COLUMN "valid_from";--> statement-breakpoint
ALTER TABLE "offers" DROP COLUMN "valid_to";--> statement-breakpoint
ALTER TABLE "offers" DROP COLUMN "applicable_items";--> statement-breakpoint
ALTER TABLE "offers" DROP COLUMN "terms_conditions";--> statement-breakpoint
ALTER TABLE "offers" DROP COLUMN "redemptions";--> statement-breakpoint
ALTER TABLE "offers" DROP COLUMN "max_redemptions";--> statement-breakpoint
ALTER TABLE "packages" DROP COLUMN "base_price";--> statement-breakpoint
ALTER TABLE "packages" DROP COLUMN "vehicle_value_thresholds";--> statement-breakpoint
ALTER TABLE "packages" DROP COLUMN "duration";--> statement-breakpoint
ALTER TABLE "packages" DROP COLUMN "is_ultra";--> statement-breakpoint
ALTER TABLE "packages" DROP COLUMN "relisting_period";