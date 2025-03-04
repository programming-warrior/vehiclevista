import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { searchSchema, insertVehicleSchema } from "@shared/schema";
import { setupAuth } from "./auth";
import fetch from 'node-fetch'; // Added import for node-fetch

// Middleware to check if user is admin
const isAdmin = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  next();
};

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Set up authentication routes and middleware
  await setupAuth(app);

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

  // Create new vehicle (admin only)
  app.post("/api/vehicles", isAdmin, async (req, res) => {
    const result = insertVehicleSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid vehicle data" });
    }

    const vehicle = await storage.createVehicle(result.data);
    res.status(201).json(vehicle);
  });

  // Update vehicle (admin only)
  app.patch("/api/vehicles/:id", isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid vehicle ID" });
    }

    const result = insertVehicleSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid vehicle data" });
    }

    const vehicle = await storage.updateVehicle(id, result.data);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json(vehicle);
  });

  // Delete vehicle (admin only)
  app.delete("/api/vehicles/:id", isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid vehicle ID" });
    }

    const success = await storage.deleteVehicle(id);
    if (!success) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.sendStatus(204);
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

  // Add vehicle lookup endpoint (admin only)
  app.post("/api/vehicles/lookup", isAdmin, async (req, res) => {
    try {
      const { registrationNumber } = req.body;

      if (!process.env.DVSA_API_KEY) {
        return res.status(500).json({ message: "DVSA API key not configured" });
      }

      const response = await fetch("https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles", {
        method: "POST",
        headers: {
          "x-api-key": process.env.DVSA_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ registrationNumber }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch vehicle details");
      }

      const data = await response.json();

      res.json({
        registrationNumber: data.registrationNumber,
        make: data.make,
        model: data.model,
        yearOfManufacture: data.yearOfManufacture,
        engineCapacity: data.engineCapacity,
        fuelType: data.fuelType,
        color: data.colour,
      });
    } catch (error) {
      console.error("DVLA lookup error:", error);
      res.status(500).json({ message: "Failed to lookup vehicle details" });
    }
  });

  // User management routes (admin only)
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", isAdmin, async (req, res) => {
    try {
      const { username, email, password, role } = req.body;

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password and create user.  Assumes hashPassword function exists elsewhere.
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        role
      });

      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const { username, email, role } = req.body;
      const updatedUser = await storage.updateUser(id, {
        username,
        email,
        role
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Prevent deleting the last admin
      const user = await storage.getUser(id);
      if (user?.role === "admin") {
        const admins = await storage.getUsersByRole("admin");
        if (admins.length <= 1) {
          return res.status(400).json({ message: "Cannot delete the last admin user" });
        }
      }

      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // API Keys routes (admin only)
  app.get("/api/keys", isAdmin, async (req, res) => {
    try {
      const keys = await storage.getApiKeys();
      res.json(keys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ message: "Failed to fetch API keys" });
    }
  });

  app.patch("/api/keys", isAdmin, async (req, res) => {
    try {
      const { name, key } = req.body;
      if (!name || !key) {
        return res.status(400).json({ message: "Name and key are required" });
      }

      const updatedKey = await storage.updateApiKey(name, key);

      // Update environment variable
      process.env[`${name.toUpperCase()}_API_KEY`] = key;

      res.json(updatedKey);
    } catch (error) {
      console.error("Error updating API key:", error);
      res.status(500).json({ message: "Failed to update API key" });
    }
  });

  return httpServer;
}