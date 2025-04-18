ALTER TABLE "api_keys" ALTER COLUMN "created_at" SET DEFAULT '2025-04-16T14:08:20.936Z';--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "updated_at" SET DEFAULT '2025-04-16T14:08:20.936Z';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT '2025-04-16T14:08:20.930Z';--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "latitude" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "longitude" DROP NOT NULL;