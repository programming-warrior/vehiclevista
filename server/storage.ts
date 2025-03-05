import type { Vehicle, InsertVehicle, SearchParams, User, InsertUser } from "@shared/schema";
import { vehicles, users } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and, or, between, desc } from "drizzle-orm";
import { apiKeys, type ApiKey, type InsertApiKey } from "@shared/schema";
import { rolePermissions, type RolePermission } from "@shared/schema";
import { bulkUploads, type BulkUpload, type InsertBulkUpload } from "@shared/schema";
import { 
  auctions, events, feedbacks, spareParts, inventory, offers, pricingPlans,
  type Auction, type InsertAuction,
  type Event, type InsertEvent,
  type Feedback, type InsertFeedback,
  type SparePart, type InsertSparePart,
  type InventoryItem, type InsertInventoryItem,
  type Offer, type InsertOffer,
  type PricingPlan
} from "@shared/schema";
import type { Package, InsertPackage, UserPackage, InsertUserPackage } from "@shared/schema"; 
import { packages, userPackages } from "@shared/schema"; 

export interface IStorage {
  getVehicles(category?: string): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  searchVehicles(params: SearchParams): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: InsertVehicle): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { role?: string }): Promise<User>;
  getApiKeys(): Promise<ApiKey[]>;
  updateApiKey(name: string, key: string): Promise<ApiKey>;
  getUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getRolePermissions(): Promise<RolePermission[]>;
  updateRolePermission(id: number, permission: Partial<RolePermission>): Promise<RolePermission>;
  checkPermission(role: string, resource: string, action: "create" | "read" | "update" | "delete"): Promise<boolean>;
  createBulkUpload(upload: InsertBulkUpload): Promise<BulkUpload>;
  getBulkUploads(userId: number): Promise<BulkUpload[]>;
  updateBulkUpload(id: number, data: Partial<BulkUpload>): Promise<BulkUpload>;
  getPackages(): Promise<Package[]>;
  createPackage(data: InsertPackage): Promise<Package>;
  getUserPackages(userId: number): Promise<UserPackage[]>;
  createUserPackage(data: InsertUserPackage): Promise<UserPackage>;

  // Add new methods for auctions
  getAuctions(): Promise<Auction[]>;
  createAuction(auction: InsertAuction): Promise<Auction>;

  // Add new methods for events
  getEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;

  // Add new methods for feedback
  getFeedbacks(): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;

  // Add new methods for spare parts
  getSpareParts(): Promise<SparePart[]>;
  createSparePart(sparePart: InsertSparePart): Promise<SparePart>;

  // Add new methods for inventory
  getInventory(): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;

  // Add new methods for offers
  getOffers(): Promise<Offer[]>;
  createOffer(offer: InsertOffer): Promise<Offer>;

  // Add new methods for pricing plans
  getPricingPlans(): Promise<PricingPlan[]>;
  createPricingPlan(plan: InsertPricingPlan): Promise<PricingPlan>;
}

export class DatabaseStorage implements IStorage {
  async getVehicles(category?: string): Promise<Vehicle[]> {
    if (category && category !== "all") {
      return await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.category, category));
    }
    return await db.select().from(vehicles);
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id));
    return vehicle;
  }

  async searchVehicles(params: SearchParams): Promise<Vehicle[]> {
    const conditions = [];

    if (params.query) {
      conditions.push(
        or(
          ilike(vehicles.title, `%${params.query}%`),
          ilike(vehicles.make, `%${params.query}%`),
          ilike(vehicles.model, `%${params.query}%`)
        )
      );
    }

    if (params.category) {
      conditions.push(eq(vehicles.category, params.category));
    }

    if (params.make) {
      conditions.push(eq(vehicles.make, params.make));
    }

    if (params.bodyType) {
      conditions.push(eq(vehicles.bodyType, params.bodyType));
    }

    if (params.minPrice !== undefined && params.maxPrice !== undefined) {
      conditions.push(
        between(vehicles.price, params.minPrice, params.maxPrice)
      );
    }

    return await db
      .select()
      .from(vehicles)
      .where(and(...conditions));
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db
      .insert(vehicles)
      .values(vehicle)
      .returning();
    return newVehicle;
  }

  async updateVehicle(id: number, vehicle: InsertVehicle): Promise<Vehicle | undefined> {
    const [updatedVehicle] = await db
      .update(vehicles)
      .set(vehicle)
      .where(eq(vehicles.id, id))
      .returning();
    return updatedVehicle;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(vehicles)
      .where(eq(vehicles.id, id))
      .returning();
    return !!deleted;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser & { role?: string }): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values({
        ...user,
        role: user.role || "user",
      })
      .returning();
    return newUser;
  }

  async getApiKeys(): Promise<ApiKey[]> {
    return await db.select().from(apiKeys);
  }

  async updateApiKey(name: string, key: string): Promise<ApiKey> {
    const [updatedKey] = await db
      .update(apiKeys)
      .set({
        key,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(apiKeys.name, name))
      .returning();

    return updatedKey;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, role));
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return !!deleted;
  }

  async getRolePermissions(): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions);
  }

  async updateRolePermission(id: number, permission: Partial<RolePermission>): Promise<RolePermission> {
    const [updated] = await db
      .update(rolePermissions)
      .set(permission)
      .where(eq(rolePermissions.id, id))
      .returning();
    return updated;
  }

  async checkPermission(
    role: string,
    resource: string,
    action: "create" | "read" | "update" | "delete"
  ): Promise<boolean> {
    if (role === "admin") return true;

    const [permission] = await db
      .select()
      .from(rolePermissions)
      .where(
        and(
          eq(rolePermissions.role, role),
          eq(rolePermissions.resource, resource)
        )
      );

    if (!permission) return false;

    switch (action) {
      case "create": return permission.canCreate;
      case "read": return permission.canRead;
      case "update": return permission.canUpdate;
      case "delete": return permission.canDelete;
    }
  }
  async createBulkUpload(upload: InsertBulkUpload): Promise<BulkUpload> {
    const [newUpload] = await db
      .insert(bulkUploads)
      .values({
        ...upload,
        status: "pending",
      })
      .returning();
    return newUpload;
  }

  async getBulkUploads(userId: number): Promise<BulkUpload[]> {
    return await db
      .select()
      .from(bulkUploads)
      .where(eq(bulkUploads.userId, userId))
      .orderBy(desc(bulkUploads.createdAt));
  }

  async updateBulkUpload(id: number, data: Partial<BulkUpload>): Promise<BulkUpload> {
    const [updated] = await db
      .update(bulkUploads)
      .set(data)
      .where(eq(bulkUploads.id, id))
      .returning();
    return updated;
  }
  async getPackages(): Promise<Package[]> {
    return await db.select().from(packages);
  }

  async createPackage(data: InsertPackage): Promise<Package> {
    const [newPackage] = await db
      .insert(packages)
      .values(data)
      .returning();
    return newPackage;
  }

  async getUserPackages(userId: number): Promise<UserPackage[]> {
    return await db
      .select()
      .from(userPackages)
      .where(eq(userPackages.userId, userId));
  }

  async createUserPackage(data: InsertUserPackage): Promise<UserPackage> {
    const [newUserPackage] = await db
      .insert(userPackages)
      .values(data)
      .returning();
    return newUserPackage;
  }

  // Implement auction methods
  async getAuctions(): Promise<Auction[]> {
    return await db.select().from(auctions);
  }

  async createAuction(auction: InsertAuction): Promise<Auction> {
    const [newAuction] = await db
      .insert(auctions)
      .values(auction)
      .returning();
    return newAuction;
  }

  // Implement event methods
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db
      .insert(events)
      .values({
        ...event,
        date: new Date(event.date).toISOString(), // Ensure proper date format
        registeredCount: 0, // Set default value
      })
      .returning();
    return newEvent;
  }

  // Implement feedback methods
  async getFeedbacks(): Promise<Feedback[]> {
    return await db.select().from(feedbacks);
  }

  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db
      .insert(feedbacks)
      .values(feedback)
      .returning();
    return newFeedback;
  }

  // Implement spare parts methods
  async getSpareParts(): Promise<SparePart[]> {
    return await db.select().from(spareParts);
  }

  async createSparePart(sparePart: InsertSparePart): Promise<SparePart> {
    const [newSparePart] = await db
      .insert(spareParts)
      .values(sparePart)
      .returning();
    return newSparePart;
  }

  // Implement inventory methods
  async getInventory(): Promise<InventoryItem[]> {
    return await db.select().from(inventory);
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [newItem] = await db
      .insert(inventory)
      .values(item)
      .returning();
    return newItem;
  }

  // Implement offer methods
  async getOffers(): Promise<Offer[]> {
    return await db.select().from(offers);
  }

  async createOffer(offer: InsertOffer): Promise<Offer> {
    const [newOffer] = await db
      .insert(offers)
      .values(offer)
      .returning();
    return newOffer;
  }

  // Implement pricing plan methods
  async getPricingPlans(): Promise<PricingPlan[]> {
    return await db.select().from(pricingPlans);
  }

  async createPricingPlan(plan: InsertPricingPlan): Promise<PricingPlan> {
    const [newPlan] = await db
      .insert(pricingPlans)
      .values(plan)
      .returning();
    return newPlan;
  }
}

export const storage = new DatabaseStorage();