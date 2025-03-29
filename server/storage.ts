import type {
  Vehicle,
  InsertVehicle,
  SearchParams,
  User,
  InsertUser,
} from "@shared/schema";
import { vehicles, users } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and, or, between, desc } from "drizzle-orm";
import { apiKeys, type ApiKey, type InsertApiKey } from "@shared/schema";
import { rolePermissions, type RolePermission } from "@shared/schema";
import {
  bulkUploads,
  type BulkUpload,
  type InsertBulkUpload,
} from "@shared/schema";
import {
  auctions,
  events,
  feedbacks,
  spareParts,
  inventory,
  offers,
  pricingPlans,
  type Auction,
  type InsertAuction,
  type Event,
  type InsertEvent,
  type Feedback,
  type InsertFeedback,
  type SparePart,
  type InsertSparePart,
  type InventoryItem,
  type InsertInventoryItem,
  type Offer,
  type InsertOffer,
  type PricingPlan,
} from "@shared/schema";
import type {
  Package,
  InsertPackage,
  UserPackage,
  InsertUserPackage,
} from "@shared/schema";
import { packages, userPackages } from "@shared/schema";
import { InsertPricingPlan } from "@shared/schema";

export interface IStorage {
  getVehicles(category?: string): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  searchVehicles(params: SearchParams): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(
    id: number,
    vehicle: InsertVehicle
  ): Promise<Vehicle | undefined>;
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
  updateRolePermission(
    id: number,
    permission: Partial<RolePermission>
  ): Promise<RolePermission>;
  checkPermission(
    role: string,
    resource: string,
    action: "create" | "read" | "update" | "delete"
  ): Promise<boolean>;
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
    try {
      if (category && category !== "all") {
        return await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.category, category));
      }
      return await db.select().from(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      throw new Error("Failed to fetch vehicles");
    }
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    try {
      const [vehicle] = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.id, id));
      return vehicle;
    } catch (error) {
      console.error(`Error fetching vehicle ${id}:`, error);
      throw new Error("Failed to fetch vehicle");
    }
  }

  async searchVehicles(params: SearchParams): Promise<Vehicle[]> {
    try {
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
    } catch (error) {
      console.error("Error searching vehicles:", error);
      throw new Error("Failed to search vehicles");
    }
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    try {
      const [newVehicle] = await db
        .insert(vehicles)
        .values(vehicle)
        .returning();
      return newVehicle;
    } catch (error) {
      console.error("Error creating vehicle:", error);
      throw new Error("Failed to create vehicle");
    }
  }

  async updateVehicle(
    id: number,
    vehicle: InsertVehicle
  ): Promise<Vehicle | undefined> {
    try {
      const [updatedVehicle] = await db
        .update(vehicles)
        .set(vehicle)
        .where(eq(vehicles.id, id))
        .returning();
      return updatedVehicle;
    } catch (error) {
      console.error(`Error updating vehicle ${id}:`, error);
      throw new Error("Failed to update vehicle");
    }
  }

  async deleteVehicle(id: number): Promise<boolean> {
    try {
      const [deleted] = await db
        .delete(vehicles)
        .where(eq(vehicles.id, id))
        .returning();
      return !!deleted;
    } catch (error) {
      console.error(`Error deleting vehicle ${id}:`, error);
      throw new Error("Failed to delete vehicle");
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw new Error("Failed to fetch user");
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error(`Error fetching user by username ${username}:`, error);
      throw new Error("Failed to fetch user");
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [newUser] = await db
        .insert(users)
        .values({
          ...user,
          role: user.role || "user",
        })
        .returning();
      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  }

  async getApiKeys(): Promise<ApiKey[]> {
    try {
      return await db.select().from(apiKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      throw new Error("Failed to fetch API keys");
    }
  }

  async updateApiKey(name: string, key: string): Promise<ApiKey> {
    try {
      const [updatedKey] = await db
        .update(apiKeys)
        .set({
          key,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(apiKeys.name, name))
        .returning();

      return updatedKey;
    } catch (error) {
      console.error(`Error updating API key ${name}:`, error);
      throw new Error("Failed to update API key");
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Failed to fetch users");
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    try {
      return await db.select().from(users).where(eq(users.role, role));
    } catch (error) {
      console.error(`Error fetching users by role ${role}:`, error);
      throw new Error("Failed to fetch users");
    }
  }

  async updateUser(
    id: number,
    userData: Partial<User>
  ): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw new Error("Failed to update user");
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const [deleted] = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning();
      return !!deleted;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw new Error("Failed to delete user");
    }
  }

  async getRolePermissions(): Promise<RolePermission[]> {
    try {
      return await db.select().from(rolePermissions);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      throw new Error("Failed to fetch role permissions");
    }
  }

  async updateRolePermission(
    id: number,
    permission: Partial<RolePermission>
  ): Promise<RolePermission> {
    try {
      const [updated] = await db
        .update(rolePermissions)
        .set(permission)
        .where(eq(rolePermissions.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error(`Error updating role permission ${id}:`, error);
      throw new Error("Failed to update role permission");
    }
  }

  async checkPermission(
    role: string,
    resource: string,
    action: "create" | "read" | "update" | "delete"
  ): Promise<boolean> {
    try {
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
        case "create":
          return permission.canCreate;
        case "read":
          return permission.canRead;
        case "update":
          return permission.canUpdate;
        case "delete":
          return permission.canDelete;
      }
    } catch (error) {
      console.error(
        `Error checking permission for role ${role}, resource ${resource}, action ${action}:`,
        error
      );
      throw new Error("Failed to check permission");
    }
  }
  async createBulkUpload(upload: InsertBulkUpload): Promise<BulkUpload> {
    try {
      const [newUpload] = await db
        .insert(bulkUploads)
        .values({
          ...upload,
          status: "pending",
        })
        .returning();
      return newUpload;
    } catch (error) {
      console.error("Error creating bulk upload:", error);
      throw new Error("Failed to create bulk upload");
    }
  }

  async getBulkUploads(userId: number): Promise<BulkUpload[]> {
    try {
      return await db
        .select()
        .from(bulkUploads)
        .where(eq(bulkUploads.userId, userId))
        .orderBy(desc(bulkUploads.createdAt));
    } catch (error) {
      console.error(`Error fetching bulk uploads for user ${userId}:`, error);
      throw new Error("Failed to fetch bulk uploads");
    }
  }

  async updateBulkUpload(
    id: number,
    data: Partial<BulkUpload>
  ): Promise<BulkUpload> {
    try {
      const [updated] = await db
        .update(bulkUploads)
        .set(data)
        .where(eq(bulkUploads.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error(`Error updating bulk upload ${id}:`, error);
      throw new Error("Failed to update bulk upload");
    }
  }
  async getPackages(): Promise<Package[]> {
    try {
      return await db.select().from(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      throw new Error("Failed to fetch packages");
    }
  }

  async createPackage(data: InsertPackage): Promise<Package> {
    try {
      const [newPackage] = await db.insert(packages).values(data).returning();
      return newPackage;
    } catch (error) {
      console.error("Error creating package:", error);
      throw new Error("Failed to create package");
    }
  }

  async getUserPackages(userId: number): Promise<UserPackage[]> {
    try {
      return await db
        .select()
        .from(userPackages)
        .where(eq(userPackages.userId, userId));
    } catch (error) {
      console.error(`Error fetching user packages for user ${userId}:`, error);
      throw new Error("Failed to fetch user packages");
    }
  }

  async createUserPackage(data: InsertUserPackage): Promise<UserPackage> {
    try {
      const [newUserPackage] = await db
        .insert(userPackages)
        .values(data)
        .returning();
      return newUserPackage;
    } catch (error) {
      console.error("Error creating user package:", error);
      throw new Error("Failed to create user package");
    }
  }

  // Implement auction methods
  async getAuctions(): Promise<Auction[]> {
    try {
      return await db.select().from(auctions);
    } catch (error) {
      console.error("Error fetching auctions:", error);
      throw new Error("Failed to fetch auctions");
    }
  }

  async createAuction(auction: InsertAuction): Promise<Auction> {
    try {
      // Format the auction data with proper date handling
      const startDate = new Date(auction.startDate);
      const endDate = new Date(auction.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date format provided");
      }

      const auctionData = {
        title: auction.title,
        description: auction.description,
        startingPrice: auction.startingPrice,
        vehicleId: auction.vehicleId,
        startDate: startDate, // Pass Date object directly
        endDate: endDate, // Pass Date object directly
        status: auction.status || "upcoming",
        currentBid: auction.startingPrice,
        totalBids: 0,
      };

      console.log("Creating auction with data:", auctionData);

      const [newAuction] = await db
        .insert(auctions)
        .values(auctionData)
        .returning();

      return newAuction;
    } catch (error) {
      console.error("Error creating auction:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to create auction: ${error.message}`);
      }
      throw new Error("Failed to create auction: Unknown error");
    }
  }

  // Implement event methods
  async getEvents(): Promise<Event[]> {
    try {
      return await db.select().from(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      throw new Error("Failed to fetch events");
    }
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    try {
      // Format and validate the event data
      const eventDate = new Date(event.date); // Create Date object
      if (isNaN(eventDate.getTime())) {
        // Add validation
        throw new Error("Invalid date format provided for event date");
      }

      const eventData = {
        title: event.title,
        description: event.description,
        eventType: event.eventType,
        date: eventDate, // Pass the Date object directly
        location: event.location,
        capacity: event.capacity,
        registeredCount: 0,
        status: event.status || "upcoming",
      };

      console.log("Creating event with data:", eventData);

      const [newEvent] = await db
        .insert(events)
        .values(eventData) // Pass the object directly, not in an array
        .returning();

      return newEvent;
    } catch (error) {
      console.error("Error creating event in storage:", error);
      // Re-throw specific error message if available
      if (error instanceof Error) {
        throw new Error(`Failed to create event in database: ${error.message}`);
      }
      throw new Error("Failed to create event in database: Unknown error");
    }
  }

  // Implement feedback methods
  async getFeedbacks(): Promise<Feedback[]> {
    try {
      return await db.select().from(feedbacks);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      throw new Error("Failed to fetch feedbacks");
    }
  }

  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    try {
      const [newFeedback] = await db
        .insert(feedbacks)
        .values(feedback)
        .returning();
      return newFeedback;
    } catch (error) {
      console.error("Error creating feedback:", error);
      throw new Error("Failed to create feedback");
    }
  }

  // Implement spare parts methods
  async getSpareParts(): Promise<SparePart[]> {
    try {
      return await db.select().from(spareParts);
    } catch (error) {
      console.error("Error fetching spare parts:", error);
      throw new Error("Failed to fetch spare parts");
    }
  }

  async createSparePart(sparePart: InsertSparePart): Promise<SparePart> {
    try {
      const [newSparePart] = await db
        .insert(spareParts)
        .values(sparePart)
        .returning();
      return newSparePart;
    } catch (error) {
      console.error("Error creating spare part:", error);
      throw new Error("Failed to create spare part");
    }
  }

  // Implement inventory methods
  async getInventory(): Promise<InventoryItem[]> {
    try {
      return await db.select().from(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      throw new Error("Failed to fetch inventory");
    }
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    try {
      const [newItem] = await db.insert(inventory).values(item).returning();
      return newItem;
    } catch (error) {
      console.error("Error creating inventory item:", error);
      throw new Error("Failed to create inventory item");
    }
  }

  // Implement offer methods
  async getOffers(): Promise<Offer[]> {
    try {
      return await db.select().from(offers);
    } catch (error) {
      console.error("Error fetching offers:", error);
      throw new Error("Failed to fetch offers");
    }
  }

  async createOffer(offer: InsertOffer): Promise<Offer> {
    try {
      // Convert date strings to Date objects
      const validFromDate = new Date(offer.validFrom);
      const validToDate = new Date(offer.validTo);

      if (isNaN(validFromDate.getTime()) || isNaN(validToDate.getTime())) {
        throw new Error(
          "Invalid date format provided for offer validity dates"
        );
      }

      // Create the object to insert, using Date objects
      const offerData = {
        ...offer, // Spread the original offer data
        validFrom: validFromDate, // Override with Date object
        validTo: validToDate, // Override with Date object
      };

      const [newOffer] = await db
        .insert(offers)
        .values(offerData) // Pass the modified object
        .returning();
      return newOffer;
    } catch (error) {
      console.error("Error creating offer:", error);
      // Re-throw specific error message if available
      if (error instanceof Error) {
        throw new Error(`Failed to create offer: ${error.message}`);
      }
      throw new Error("Failed to create offer: Unknown error");
    }
  }

  // Implement pricing plan methods
  async getPricingPlans(): Promise<PricingPlan[]> {
    try {
      return await db.select().from(pricingPlans);
    } catch (error) {
      console.error("Error fetching pricing plans:", error);
      throw new Error("Failed to fetch pricing plans");
    }
  }

  async createPricingPlan(plan: InsertPricingPlan): Promise<PricingPlan> {
    try {
      const [newPlan] = await db.insert(pricingPlans).values(plan).returning();
      return newPlan;
    } catch (error) {
      console.error("Error creating pricing plan:", error);
      throw new Error("Failed to create pricing plan");
    }
  }
}

export const storage = new DatabaseStorage();
