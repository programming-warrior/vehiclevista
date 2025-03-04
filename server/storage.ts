import type { Vehicle, InsertVehicle, SearchParams } from "@shared/schema";
import { mockVehicles } from "../client/src/lib/mock-data";

export interface IStorage {
  getVehicles(category?: string): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  searchVehicles(params: SearchParams): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
}

export class MemStorage implements IStorage {
  private vehicles: Map<number, Vehicle>;
  private currentId: number;

  constructor() {
    this.vehicles = new Map();
    this.currentId = 1;
    
    // Initialize with mock data
    mockVehicles.forEach(vehicle => {
      this.vehicles.set(vehicle.id, vehicle);
      this.currentId = Math.max(this.currentId, vehicle.id + 1);
    });
  }

  async getVehicles(category?: string): Promise<Vehicle[]> {
    const vehicles = Array.from(this.vehicles.values());
    if (category && category !== "all") {
      return vehicles.filter(v => v.category === category);
    }
    return vehicles;
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async searchVehicles(params: SearchParams): Promise<Vehicle[]> {
    let vehicles = Array.from(this.vehicles.values());

    if (params.query) {
      const query = params.query.toLowerCase();
      vehicles = vehicles.filter(v => 
        v.title.toLowerCase().includes(query) ||
        v.make.toLowerCase().includes(query) ||
        v.model.toLowerCase().includes(query)
      );
    }

    if (params.category) {
      vehicles = vehicles.filter(v => v.category === params.category);
    }

    if (params.make) {
      vehicles = vehicles.filter(v => v.make === params.make);
    }

    if (params.bodyType) {
      vehicles = vehicles.filter(v => v.bodyType === params.bodyType);
    }

    if (params.minPrice !== undefined) {
      vehicles = vehicles.filter(v => v.price >= params.minPrice!);
    }

    if (params.maxPrice !== undefined) {
      vehicles = vehicles.filter(v => v.price <= params.maxPrice!);
    }

    return vehicles;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.currentId++;
    const newVehicle = { ...vehicle, id };
    this.vehicles.set(id, newVehicle);
    return newVehicle;
  }
}

export const storage = new MemStorage();
