import { time } from "console";
import { is } from "drizzle-orm";
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
  unique,
  json,
  interval,
  bigint,
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

export const vehicleConditions = [
  "clean",
  "catS",
  "catN",
  "catA",
  "catB",
] as const;
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
  "SOLD",
  "ENDED",
] as const;
export const auctinStatusEnum = pgEnum("auction_status", auctionStatus);


export const systemConfig = pgTable("system_config",{
  id: serial("id").primaryKey(),
  isAuctionVisible: boolean('is_auction_visible').notNull().default(true),
})

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
  category: text("category"), // 'dealer', 'classified', 'auction'
  condition: vehicleConditionsEnum().notNull().default("clean"),
  openToPX: boolean("open_to_px").default(false),
  sellerId: integer("seller_id").notNull(),
  sellerType: text("seller_type"), // private, trader, garage
  contactPreference: text("contact_preference"), // 'phone', 'email', 'both'
  listingStatus: vehicleListingStatusEnum().notNull().default("ACTIVE"),
  listingType: text("listing_type").default("CLASSIFIED"), //for knowing if the vehicle is listed as classified or through auction
  others: json("others").default(null), // may contain number_of_doors, co2_emission, mpg_range_filter, number_prev_owner, first_registration  ... 
  engine: json("engine").default(null),
  expiresAt: timestamp("expires_at"),
  blacklistReason: text("reason"),
  negotiable: boolean("negotiable").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  views: integer("views").default(0),
  clicks: integer("clicks").default(0),
  leads: integer("leads").default(0),
});

export const vehicleFavourites = pgTable(
  "vehicle_favourite",
  {
    id: serial("id").primaryKey(),
    vehicleId: integer("vehicle_id").references(() => vehicles.id),
    userId: integer("user_id").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow()
  },
  (table) => [unique().on(table.vehicleId, table.userId)]
);

export const recentViews = pgTable(
  "recent_views",
  {
    id: serial("id").primaryKey(),
    classifiedId: integer("classified_id"),
    auctionId: integer("auction_id"),
    userId: integer("user_id").references(() => users.id),
    viewedAt: timestamp("viewsAt").defaultNow()
  },
  (table) => [unique().on(table.classifiedId, table.userId), unique().on(table.auctionId, table.userId) ]
);

export const auctionFavourites = pgTable("auction_favourites", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").references(() => auctions.id),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

export const paymentSession = pgTable("payment_session", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  packageId: integer("package_id").references(() => packages.id),
  draftId: integer("draft_id"),
  listingId: integer("listing_id"),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("gbp"),
  status: text("status").notNull().default("PENDING"), // PENDING, SUCCEEDED
  // , FAILED
  paymentIntentId: text("payment_intent_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const refundReasons = [
  "AUCTION_CREATION_FAILED",
  "CLASSIFIED_CREATION_FAILED", 
  "BID_FAILED",
  "RAFFLE_TICKET_FAILED",
  "CONDITION_NOT_MET",
  "REQUESTED_BY_ADMIN",
  "OTHER"
] as const;
export const refundReasonsEnum = pgEnum("refund_reasons", refundReasons);

export const refundStatus = ["PENDING", "COMPLETED", "FAILED"] as const;
export const refundStatusEnum = pgEnum("refund_status", refundStatus);

export const refunds = pgTable("refunds", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  paymentIntentId: text("payment_intent_id").notNull(),
  stripeRefundId: text("stripe_refund_id"),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("gbp"),
  reason: refundReasonsEnum().notNull(),
  reasonDetails: text("reason_details"), // Additional context about the refund
  status: refundStatusEnum().notNull().default("PENDING"),
  listingId: integer("listing_id"), // Reference to auction or classified listing if applicable
  listingType: text("listing_type"), // "AUCTION", "CLASSIFIED", "RAFFLE"
  bidId: integer("bid_id"), // Reference to bid if applicable
  packageId: integer("package_id"), // Reference to package if applicable
  processedBy: integer("processed_by"), // Admin user ID if manually processed
  errorMessage: text("error_message"), // Error details if refund failed
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const auctionDrafts = pgTable("auction_drafts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startingPrice: real("starting_price").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  itemId: integer("item_id"),
  itemType: text("item_type").notNull().default("VEHICLE"), //VEHICLE, NUMBERPLATE
  sellerId: integer("seller_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vehicleDrafts = pgTable("vehicle_drafts", {
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
  others: json("others").default(null), // may contain number_of_doors, co2_emission, mpg_range_filter, number_prev_owner, first_registration  ... 
  engine: json("engine").default(null),
  images: text("images").array().notNull(),
  category: text("category"), // 'dealer', 'classified', 'auction'
  condition: vehicleConditionsEnum().notNull().default("clean"),
  openToPX: boolean("open_to_px").default(false),
  sellerId: integer("seller_id").notNull(),
  sellerType: text("seller_type"), // private, trader, garage
  contactPreference: text("contact_preference"), // 'phone', 'email', 'both'
  listingStatus: vehicleListingStatusEnum().notNull().default("ACTIVE"),
  listingType: text("listing_type").default("CLASSIFIED"),
  blacklistReason: text("reason"),
  negotiable: boolean("negotiable").default(true),
  createdAt: timestamp("created_at").defaultNow(),
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
  status: text("status").notNull().default("UPCOMING"), //UPCOMING, RUNNING, ENDED
  winner: integer("winner").references(()=>users.id),

  createdAt: timestamp("created_at").defaultNow(),

  views: integer("views").default(0),
  clicks: integer("clicks").default(0),
  leads: integer("leads").default(0),
});

export const adminIpLogs = pgTable("admin_ip_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id")
    .notNull()
    .references(() => users.id),
  ipAddress: text("ip_address").notNull(),
  locationCity: text("location_city"),
  locationCountry: text("location_country"),
  deviceBrowser: text("device_browser"),  
  deviceOs: text("device_os"),
  userAgentRaw: text("user_agent_raw"),
  sessionDuration: integer("session_duration"), 
  status: text("status").notNull().default("failed"), 
  createdAt: timestamp("created_at").defaultNow(),
});

export const platformSummaryHistory = pgTable("platform_summary_history", {
  id: serial("id").primaryKey(),
  recorded_at: timestamp("recorded_at").notNull(),

  // Absolute Totals
  total_vehicles: integer("total_vehicles").notNull().default(0),
  total_auctions: integer("total_auctions").notNull().default(0),
  total_users: integer("total_users").notNull().default(0),

  // Vehicle Metric Totals
  total_vehicle_views: integer("total_vehicle_views").notNull().default(0),
  total_vehicle_clicks: integer("total_vehicle_clicks").notNull().default(0),
  total_vehicle_leads: integer("total_vehicle_leads").notNull().default(0),

  // Auction Metric Totals
  total_auction_views: integer("total_auction_views").notNull().default(0),
  total_auction_clicks: integer("total_auction_clicks").notNull().default(0),
  total_auction_leads: integer("total_auction_leads").notNull().default(0),
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
  emailVerified: boolean("email_verified").notNull().default(false),
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
  type: text("type").notNull(), // 'CLASSIFIED', 'AUCTION-VEHICLE', 'AUCTION-NUMBERPLATE'
  prices: jsonb("prices").notNull(), //[minCarValue, maxCarValue, price]
  duration_days: integer("duration_days").notNull(), // in days (14, 28, or NULL for ultra sold)
  features: jsonb("features").array().notNull(),
  is_until_sold: boolean("is_until_sold").default(false),
  is_rebookable: boolean("is_rebookable").default(false), // for ultra package
  rebookable_days: integer("rebookable_days"), // in days, for ultra package
  youtubeShowcase: boolean("youtube_showcase").default(false),
  premiumPlacement: boolean("premium_placement").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  is_active: boolean("is_active").default(true),
});

// Add user packages table
export const userListingPackages = pgTable("user_listing_packages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  packageId: integer("package_id")
    .notNull()
    .references(() => packages.id),
  listing_id: integer("listing_id").notNull(), //auction or classified
  purchased_at: timestamp("purchased_at").defaultNow(),
  expires_at: timestamp("expires_at").notNull(),
  vehicleValue: real("vehicle_value").notNull(), // value of the vehicle for which the package was purchased
  pricePaid: real("price_paid").notNull(), // price paid for the package
  is_active: boolean("is_active").default(true),
});

// Auction table with proper schema
export const auctions = pgTable("auctions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  itemType: text("item_type").notNull().default("VEHICLE"), // VEHICLE, NUMBER_PLATE
  itemId: integer("item_id"),
  startingPrice: real("starting_price").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: auctinStatusEnum().notNull().default("UPCOMING"), // UPCOMING, RUNNING, ENDED
  currentBid: real("current_bid").default(0),
  totalBids: integer("total_bids").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  sellerId: integer("seller_id").references(() => users.id),
  blacklistReason: text(),
  views: integer("views").default(0),
  clicks: integer("clicks").default(0),
  leads: integer("leads").default(0),
});

export const numberPlate = pgTable("number_plate", {
  id: serial("id").primaryKey(),
  plate_number: text("plate_number").notNull(),
  document_url: text("document_url").array().notNull(),
  plate_value: real("plate_value").notNull(),
  sellerId: integer("seller_id").references(() => users.id),
  status: text().notNull().default("PENDING"), //PENDING, ACTIVE, EXPIRED
  created_at: timestamp().defaultNow(),
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
  conditions: text("conditions").notNull(),
  discountValue: real("discount_value").notNull(),
  discountType: text("discount_type").notNull(), // percentage, fixed, free
  minPurchase: real("min_purchase"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  packageIds: integer("packages_id"),
  joiningDependent: boolean("joining_dependent").default(false), // whether the offer is dependent on joining a package
  joiningFirstMonths: integer("joining_first_months").default(0), // number of months for which the offer is valid after joining
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, INACTIVE, EXPIRED
  createdAt: timestamp("created_at").defaultNow(),
});

export const userOffers = pgTable("user_offers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  offerId: integer("offer_id")
    .notNull()
    .references(() => offers.id),
  redeemed: boolean("redeemed").default(false),
  redeemedAt: timestamp("redeemed_at"),
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

export const insertUserPackageSchema = createInsertSchema(
  userListingPackages
).omit({
  id: true,
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
  discountType: z.enum(["percentage", "fixed"]),
  startDate: z.string().min(1, "Valid from date is required"),
  endDate: z.string().min(1, "Valid to date is required"),
}).omit({
  id: true,
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
export type Raffle = typeof raffle.$inferSelect;
export type Package = typeof packages.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type UserPackage = typeof userListingPackages.$inferSelect;
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

// Trader request status enum
export const traderRequestStatus = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;
export const traderRequestStatusEnum = pgEnum("trader_request_status", traderRequestStatus);

// Trader requests table
export const traderRequests = pgTable("trader_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  ukCompanyName: text("uk_company_name").notNull(),
  ukCompanyNumber: text("uk_company_number").notNull(),
  status: traderRequestStatusEnum().notNull().default("PENDING"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTraderRequestSchema = createInsertSchema(traderRequests).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  createdAt: true,
  updatedAt: true,
});

export type TraderRequest = typeof traderRequests.$inferSelect;
export type InsertTraderRequest = z.infer<typeof insertTraderRequestSchema>;

export const insertRefundSchema = createInsertSchema(refunds).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type Refund = typeof refunds.$inferSelect;
export type InsertRefund = z.infer<typeof insertRefundSchema>;

export const searchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  make: z.string().optional(),
  bodyType: z.string().optional(),
});

export type SearchParams = z.infer<typeof searchSchema>;
