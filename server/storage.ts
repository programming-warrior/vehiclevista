import type { Vehicle, InsertVehicle, SearchParams, User, InsertUser } from "@shared/schema";
import { vehicles, users } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and, or, between, desc } from "drizzle-orm";
import { apiKeys, type ApiKey, type InsertApiKey } from "@shared/schema";
import { rolePermissions, type RolePermission } from "@shared/schema";
import { bulkUploads, type BulkUpload, type InsertBulkUpload } from "@shared/schema";

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
}

export const storage = new DatabaseStorage();