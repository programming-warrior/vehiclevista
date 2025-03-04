import { pgTable, text, serial, boolean, real, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
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
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  images: text("images").array().notNull(),
  category: text("category").notNull(),
  condition: text("condition").default("clean"), // clean, catS, catN
  openToPX: boolean("open_to_px").default(false),
  sellerId: integer("seller_id").notNull(),
  sellerType: text("seller_type").notNull(), // private, trader, garage
  createdAt: timestamp("created_at").defaultNow(),
  views: integer("views").default(0),
  clicks: integer("clicks").default(0),
  leads: integer("leads").default(0),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("buyer"), // "admin", "buyer", "seller", "trader", "garage"
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  // New fields for trader/garage accounts
  businessName: text("business_name"),
  businessAddress: text("business_address"),
  packageType: text("package_type"), // standard, premium, enterprise
  packageExpiresAt: timestamp("package_expires_at"),
  monthlyAllowance: integer("monthly_allowance"), // number of listings allowed per month
  usedAllowance: integer("used_allowance").default(0),
  performanceTracking: jsonb("performance_tracking").default("{}"), // Add performance tracking field

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

export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // standard, premium, enterprise
  price: integer("price").notNull(),
  duration: integer("duration").notNull(), // in months
  monthlyAllowance: integer("monthly_allowance").notNull(),
  features: jsonb("features").array(),
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

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ 
  id: true,
  views: true,
  clicks: true,
  leads: true,
  createdAt: true,
}).extend({
  condition: z.enum(["clean", "catS", "catN"]).default("clean"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  role: true,
  createdAt: true,
  packageType: true,
  packageExpiresAt: true,
  monthlyAllowance: true,
  usedAllowance: true,
  performanceTracking: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "buyer", "seller", "trader", "garage"]).default("buyer"),
  businessName: z.string().optional(),
  businessAddress: z.string().optional(),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
});

export const insertBulkUploadSchema = createInsertSchema(bulkUploads).omit({
  id: true,
  status: true,
  processedVehicles: true,
  errors: true,
  createdAt: true,
});

export const insertPackageSchema = createInsertSchema(packages).omit({
  id: true,
  createdAt: true,
});

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
export type Package = typeof packages.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;

export const searchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  make: z.string().optional(),
  bodyType: z.string().optional(),
});

export type SearchParams = z.infer<typeof searchSchema>;