import type { Vehicle, InsertVehicle, SearchParams } from "@shared/schema";
import { vehicles } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and, or, between } from "drizzle-orm";

export interface IStorage {
  getVehicles(category?: string): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  searchVehicles(params: SearchParams): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
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
    } else if (params.minPrice !== undefined) {
      conditions.push(and(vehicles.price >= params.minPrice));
    } else if (params.maxPrice !== undefined) {
      conditions.push(and(vehicles.price <= params.maxPrice));
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
}

export const storage = new DatabaseStorage();