import {
  pgTable,
  text,
  serial,
  boolean,
  real,
  integer,
  timestamp,
  jsonb,
  foreignKey,
  pgEnum,
  json,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { number, string, z } from "zod";

export const userRoles = [
  "buyer",
  "seller",
  "admin",
  "trader",
  "garage",
] as const;
export const userRolesEnum = pgEnum("user_roles", userRoles);

export const vehicleTypes = ["car", "bike", "truck", "van"] as const;
export const vehicleTypesEnum = pgEnum("vehicle_types", vehicleTypes);

export const vehicleConditions = ["clean", "catS", "catN"] as const;
export const vehicleConditionsEnum = pgEnum(
  "vehicle_conditions",
  vehicleConditions
);

export const vehicleListingStatus = [
  "ACTIVE",
  "NEED_APPROVAL",
  "BLACKLISTED",
  "SOLD",
  "EXPIRED",
] as const;
export const vehicleListingStatusEnum = pgEnum(
  "vehicle_listing_status",
  vehicleListingStatus
);

export const auctionStatus = [
  "RUNNING",
  "NEED_APPROVAL",
  "BLACKLISTED",
  "UPCOMING",
  "ENDED",
] as const;
export const auctinStatusEnum = pgEnum("auction_status", auctionStatus);

// Update vehicles table with classified listing fields
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  type: vehicleTypesEnum().notNull().default("car"),
  registration_num: text("registration_num").notNull().unique(),
  title: text("title").notNull(),
  price: integer("price").notNull(),
  year: integer("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  mileage: integer("mileage").notNull(),
  fuelType: text("fuel_type").notNull(),
  transmission: text("transmission").notNull(),
  bodyType: text("body_type").notNull(),
  color: text("color").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  images: text("images").array().notNull(),
  category: text("category").notNull(), // 'dealer', 'classified', 'auction'
  condition: vehicleConditionsEnum().notNull().default("clean"),
  openToPX: boolean("open_to_px").default(false),
  sellerId: integer("seller_id").notNull(),
  sellerType: text("seller_type"), // private, trader, garage
  contactPreference: text("contact_preference"), // 'phone', 'email', 'both'
  listingStatus: vehicleListingStatusEnum().notNull().default("ACTIVE"),

  listingType: text().default("CLASSIFIED"),

  blacklistReason: text("reason"),
  negotiable: boolean("negotiable").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  views: integer("views").default(0),
  clicks: integer("clicks").default(0),
  leads: integer("leads").default(0),
});

export const contactAttempts = pgTable("contact_attempts", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id")
    .notNull()
    .references(() => vehicles.id),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  contactMethod: text("contact_method"),
  message: text("message").notNull(),
  deliveryStatus: text("delivery_status").notNull().default("pending"), // pending, delivered, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  sentTo: integer("sent_to")
    .notNull()
    .references(() => users.id),
  isRead: boolean("is_read").notNull().default(false),
  message: jsonb("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const make = pgTable("make", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  logoUrl: text("logo_url"),
  entries: integer("entries").notNull().default(0),
  searched: integer("searched").notNull().default(0),
});

export const model = pgTable("model", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  makeId: integer("makeId")
    .notNull()
    .references(() => make.id),
  entries: integer("entries").notNull().default(0),
  searched: integer("searched").notNull().default(0),
});

export const raffle = pgTable("raffle", {
  id: serial("id").primaryKey(),

  //vehicle data
  type: vehicleTypesEnum().notNull().default("car"),
  registration_num: text("registration_num").notNull().unique(),
  price: integer("price").notNull(),
  year: integer("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  mileage: integer("mileage").notNull(),
  fuelType: text("fuel_type").notNull(),
  transmission: text("transmission").notNull(),
  bodyType: text("body_type").notNull(),
  color: text("color").notNull(),
  location: text("location").notNull(),
  images: text("images").array().notNull(),
  condition: vehicleConditionsEnum().notNull().default("clean"),

  //raffle data
  title: text("title").notNull(),
  description: text("description").notNull(),
  ticketPrice: real("ticket_price").notNull(),
  ticketQuantity: integer("ticket_quantity").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  featured: boolean().notNull().default(true),
  soldTicket: integer("sold_ticket").notNull().default(0),
  status: text("status").notNull().default("running"),

  createdAt: timestamp("created_at").defaultNow(),

  views: integer("views").default(0),
  clicks: integer("clicks").default(0),
  leads: integer("leads").default(0),
});

export const vehicleMetricsHistory = pgTable("vehicle_metrics_history", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id")
    .notNull()
    .references(() => vehicles.id),
  views: integer("views").notNull(),
  clicks: integer("clicks").notNull(),
  leads: integer("leads").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

export const auctionMetricsHistory = pgTable("auction_metrics_history", {
  id: serial("id").primaryKey(),
  auctionId: integer("vehicle_id")
    .notNull()
    .references(() => auctions.id),
  views: integer("views").notNull(),
  clicks: integer("clicks").notNull(),
  leads: integer("leads").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

export const blacklistStatusEnum = pgEnum("status", [
  "active",
  "blacklisted",
  "inactive",
]);
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  authProvider: text("auth_provider").notNull().default("local"),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: userRolesEnum().notNull().default("buyer"), // "admin", "buyer", "seller", "trader", "garage"
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  status: blacklistStatusEnum().notNull().default("active"),
  blacklistReason: text("reason"),
  businessName: text("business_name"),
  businessAddress: text("business_address"),
  packageType: text("package_type"), // standard, premium, enterprise
  packageExpiresAt: timestamp("package_expires_at"),
  monthlyAllowance: integer("monthly_allowance"), // number of listings allowed per month
  usedAllowance: integer("used_allowance").default(0),
  performanceTracking: jsonb("performance_tracking").default("{}"), // Add performance tracking field
  card: jsonb("card").default("{}"),
});

export const lisitngReport = pgTable("listing_report", {
  id: serial("id").primaryKey(),
  reported_vehicle: integer("reported_vehicle").references(() => vehicles.id),
  reported_auction: integer("reported_auction").references(() => auctions.id),
  reported_by: integer("reported_by")
    .notNull()
    .references(() => users.id),
  description: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  //currently don't know where to use them
  status: text("status").notNull().default("pending"), // pending, resolved, rejected
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
});

export const userReport = pgTable("user_report", {
  id: serial("id").primaryKey(),
  reported_by: integer("reported_by")
    .notNull()
    .references(() => users.id),
  reported_for: integer("reported_for")
    .notNull()
    .references(() => users.id),
  description: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  //currently don't know where to use them
  status: text("status").notNull().default("pending"), // pending, resolved, rejected
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
});

export const blacklistCreatedByEnum = pgEnum("created_by", ["admin", "system"]);
export const blacklist_users = pgTable("blacklist_users", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  reason: text("reason").notNull(),
  status: blacklistStatusEnum().notNull().default("active"),
  createdBy: blacklistCreatedByEnum().notNull().default("admin"),
  adminId: integer("created_by")
    .notNull()
    .references(() => users.id),
});

// Update packages table with new structure
export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'standard_2week', 'standard_4week', 'ultra'
  basePrice: integer("base_price").notNull(),
  vehicleValueThresholds: jsonb("vehicle_value_thresholds").notNull(), // Array of price tiers
  duration: integer("duration").notNull(), // in days (14, 28, or 365 for ultra)
  features: jsonb("features").array().notNull(),
  isUltra: boolean("is_ultra").default(false),
  relistingPeriod: integer("relisting_period"), // in days, for ultra package
  youtubeShowcase: boolean("youtube_showcase").default(false),
  premiumPlacement: boolean("premium_placement").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Add user packages table
export const userPackages = pgTable("user_packages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  packageId: integer("package_id")
    .notNull()
    .references(() => packages.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  vehicleValue: integer("vehicle_value").notNull(),
  finalPrice: integer("final_price").notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Auction table with proper schema
export const auctions = pgTable("auctions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startingPrice: real("starting_price").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  vehicleId: integer("vehicle_id").notNull(),
  status: auctinStatusEnum().notNull().default("UPCOMING"), // upcoming, active, ended
  currentBid: real("current_bid").default(0),
  totalBids: integer("total_bids").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  sellerId: integer("seller_id").references(() => users.id),
  blacklistReason: text(),
  views: integer("views").default(0),
  clicks: integer("clicks").default(0),
  leads: integer("leads").default(0),
});

export const auctionWinner = pgTable("auction_winner", {
  id: serial("id").primaryKey(),
  bidAmount: real("bid_amount").notNull(),
  username: text().notNull(),
  userEmail: text().notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  auctionId: integer("auction_id")
    .notNull()
    .references(() => auctions.id),
  bidId: integer("bid_id")
    .notNull()
    .references(() => bids.id),
  createdAt: timestamp("created_at").defaultNow(),
});

//Bids table
export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  bidAmount: real("bid_amount").notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  auctionId: integer("auction_id")
    .notNull()
    .references(() => auctions.id),
  createdAt: timestamp("created_at").defaultNow(),
});

//Bids table
export const raffleTicketSale = pgTable("raffle_ticket_sale", {
  id: serial("id").primaryKey(),
  ticketQtn: integer("ticket_qtn").notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  raffleId: integer("raffle_id")
    .notNull()
    .references(() => raffle.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Events table with proper schema
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventType: text("event_type").notNull(), // auction, showcase, meetup
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  capacity: integer("capacity").notNull(),
  registeredCount: integer("registered_count").default(0),
  status: text("status").notNull().default("upcoming"), // upcoming, ongoing, completed
  createdAt: timestamp("created_at").defaultNow(),
});

// Feedback table with proper schema
export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  category: text("category").notNull(), // general, bug, feature, support
  priority: text("priority").notNull(), // low, medium, high
  status: text("status").notNull().default("new"), // new, in-progress, resolved
  submittedBy: text("submitted_by").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
});

// Spare Parts table with proper schema
export const spareParts = pgTable("spare_parts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  partNumber: text("part_number").notNull(),
  manufacturer: text("manufacturer").notNull(),
  category: text("category").notNull(),
  compatibleModels: text("compatible_models").array(),
  price: real("price").notNull(),
  stockLevel: integer("stock_level").notNull(),
  minStockLevel: integer("min_stock_level").notNull(),
  status: text("status").notNull().default("available"), // available, low-stock, out-of-stock
  location: text("location").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory table with proper schema
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
  cost: real("cost").notNull(),
  supplier: text("supplier"),
  location: text("location").notNull(),
  status: text("status").notNull().default("in-stock"), // in-stock, low-stock, out-of-stock
  description: text("description").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Offers table with proper schema
export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  offerType: text("offer_type").notNull(), // discount, bundle, seasonal
  discount: real("discount").notNull(),
  discountType: text("discount_type").notNull(), // percentage, fixed
  minPurchase: real("min_purchase"),
  validFrom: timestamp("valid_from").notNull(),
  validTo: timestamp("valid_to").notNull(),
  applicableItems: text("applicable_items").array(),
  termsConditions: text("terms_conditions").notNull(),
  status: text("status").notNull().default("draft"), // draft, active, expired
  redemptions: integer("redemptions").default(0),
  maxRedemptions: integer("max_redemptions"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pricing Plans table with proper schema
export const pricingPlans = pgTable("pricing_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  billingCycle: text("billing_cycle").notNull(), // monthly, quarterly, yearly
  features: text("features").array().notNull(),
  maxListings: integer("max_listings").notNull(),
  maxImages: integer("max_images").notNull(),
  prioritySupport: boolean("priority_support").default(false),
  featuredListings: integer("featured_listings").default(0),
  status: text("status").notNull().default("draft"), // draft, active, archived
  trialDays: integer("trial_days").default(0),
  subscriptions: integer("subscriptions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bulkUploads = pgTable("bulk_uploads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull(), // pending, processing, completed, failed
  fileName: text("file_name").notNull(),
  totalVehicles: integer("total_vehicles"),
  processedVehicles: integer("processed_vehicles").default(0),
  errors: jsonb("errors").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(),
  resource: text("resource").notNull(), // e.g., "vehicles", "users", "api_keys"
  canCreate: boolean("can_create").notNull().default(false),
  canRead: boolean("can_read").notNull().default(true),
  canUpdate: boolean("can_update").notNull().default(false),
  canDelete: boolean("can_delete").notNull().default(false),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  key: text("key").notNull(),
  description: text("description").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

// Add package-related schemas
export const insertPackageSchema = createInsertSchema(packages).omit({
  id: true,
  createdAt: true,
});

export const insertUserPackageSchema = createInsertSchema(userPackages).omit({
  id: true,
  createdAt: true,
});

// Create insert schemas for new tables
export const insertAuctionSchema = createInsertSchema(auctions, {
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
})
  .omit({
    id: true,
    currentBid: true,
    totalBids: true,
    createdAt: true,
  })
  .extend({
    // Add explicit validation for required fields
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    startingPrice: z.number().min(0, "Starting price must be non-negative"),
    vehicleId: z.number().min(1, "Vehicle selection is required"),
    status: z.enum(["upcoming", "active", "ended"]).default("upcoming"),
  });

// Update the event schema with more specific validation
export const insertEventSchema = createInsertSchema(events, {
  date: z
    .string()
    .min(1, "Event date is required")
    .transform((val) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date format");
      }
      return date.toISOString();
    }),
  eventType: z.enum(["auction", "showcase", "meetup"], {
    required_error: "Event type is required",
    invalid_type_error: "Invalid event type selected",
  }),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  status: z.enum(["upcoming", "ongoing", "completed"]).default("upcoming"),
}).omit({
  id: true,
  registeredCount: true,
  createdAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedbacks, {
  category: z.enum(["general", "bug", "feature", "support"]),
  priority: z.enum(["low", "medium", "high"]),
}).omit({
  id: true,
  submittedAt: true,
  resolvedAt: true,
  resolution: true,
});

export const insertSparePartSchema = createInsertSchema(spareParts).omit({
  id: true,
  createdAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  lastUpdated: true,
});

export const insertOfferSchema = createInsertSchema(offers, {
  offerType: z.enum(["discount", "bundle", "seasonal"]),
  discountType: z.enum(["percentage", "fixed"]),
  validFrom: z.string().min(1, "Valid from date is required"),
  validTo: z.string().min(1, "Valid to date is required"),
}).omit({
  id: true,
  redemptions: true,
  createdAt: true,
});

export const insertPricingPlanSchema = createInsertSchema(pricingPlans, {
  billingCycle: z.enum(["monthly", "quarterly", "yearly"]),
  maxListings: z.number().min(1, "Maximum listings must be at least 1"),
  maxImages: z.number().min(1, "Maximum images must be at least 1"),
}).omit({
  id: true,
  subscriptions: true,
  createdAt: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles)
  .omit({
    id: true,
    views: true,
    clicks: true,
    leads: true,
    createdAt: true,
  })
  .extend({
    condition: z.enum(["clean", "catS", "catN"]).default("clean"),
  });

export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    role: true,
    createdAt: true,
    packageType: true,
    packageExpiresAt: true,
    monthlyAllowance: true,
    usedAllowance: true,
    performanceTracking: true,
  })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    email: z.string().email("Invalid email address"),
    role: z
      .enum(["admin", "buyer", "seller", "trader", "garage"])
      .default("buyer"),
    businessName: z.string().optional(),
    businessAddress: z.string().optional(),
  });

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRolePermissionSchema = createInsertSchema(
  rolePermissions
).omit({
  id: true,
});

export const insertBulkUploadSchema = createInsertSchema(bulkUploads).omit({
  id: true,
  status: true,
  processedVehicles: true,
  errors: true,
  createdAt: true,
});

// Add package-related types
export type Package = typeof packages.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type UserPackage = typeof userPackages.$inferSelect;
export type InsertUserPackage = z.infer<typeof insertUserPackageSchema>;

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type BulkUpload = typeof bulkUploads.$inferSelect;
export type InsertBulkUpload = z.infer<typeof insertBulkUploadSchema>;

export type Auction = typeof auctions.$inferSelect;
export type Bid = typeof bids.$inferSelect;

export type InsertAuction = z.infer<typeof insertAuctionSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export type SparePart = typeof spareParts.$inferSelect;
export type InsertSparePart = z.infer<typeof insertSparePartSchema>;

export type InventoryItem = typeof inventory.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventorySchema>;

export type Offer = typeof offers.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;

export type PricingPlan = typeof pricingPlans.$inferSelect;
export type InsertPricingPlan = z.infer<typeof insertPricingPlanSchema>;

export const searchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  make: z.string().optional(),
  bodyType: z.string().optional(),
});

export type SearchParams = z.infer<typeof searchSchema>;
