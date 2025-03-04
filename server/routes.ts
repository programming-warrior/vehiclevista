import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { searchSchema } from "@shared/schema";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Set up authentication routes and middleware
  setupAuth(app);

  // Get all vehicles with optional category filter
  app.get("/api/vehicles", async (req, res) => {
    const category = req.query.category as string | undefined;
    const vehicles = await storage.getVehicles(category);
    res.json(vehicles);
  });

  // Get single vehicle by ID
  app.get("/api/vehicles/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid vehicle ID" });
    }

    const vehicle = await storage.getVehicle(id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json(vehicle);
  });

  // Search vehicles
  app.get("/api/vehicles/search", async (req, res) => {
    const result = searchSchema.safeParse({
      query: req.query.q,
      category: req.query.category,
      minPrice: req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined,
      make: req.query.make,
      bodyType: req.query.bodyType,
    });

    if (!result.success) {
      return res.status(400).json({ message: "Invalid search parameters" });
    }

    const vehicles = await storage.searchVehicles(result.data);
    res.json(vehicles);
  });

  return httpServer;
}