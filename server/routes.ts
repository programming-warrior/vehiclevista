import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { searchSchema, insertVehicleSchema } from "@shared/schema";
import { setupAuth } from "./auth";
import fetch from 'node-fetch';
import multer from 'multer';
import * as csv from 'csv-parse';
import * as XLSX from 'xlsx';
import { Readable } from 'stream';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

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


  // Role Permissions routes (admin only)
  app.get("/api/permissions", isAdmin, async (req, res) => {
    try {
      const permissions = await storage.getRolePermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.patch("/api/permissions/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid permission ID" });
      }

      const permission = await storage.updateRolePermission(id, req.body);
      res.json(permission);
    } catch (error) {
      console.error("Error updating permission:", error);
      res.status(500).json({ message: "Failed to update permission" });
    }
  });

  // Update the middleware to check permissions
  const checkPermission = async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as User;
    if (user.role === "admin") {
      return next();
    }

    const path = req.path.split("/")[2]; // Get resource from path, e.g., "vehicles" from "/api/vehicles"
    const method = req.method.toLowerCase();

    let action: "create" | "read" | "update" | "delete";
    switch (method) {
      case "post": action = "create"; break;
      case "get": action = "read"; break;
      case "patch":
      case "put": action = "update"; break;
      case "delete": action = "delete"; break;
      default: return res.status(405).json({ message: "Method not allowed" });
    }

    const hasPermission = await storage.checkPermission(user.role, path, action);
    if (!hasPermission) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };

  // Replace isAdmin middleware with checkPermission where appropriate
  app.use("/api/:resource", checkPermission);

  // Bulk upload routes (trader/garage only)
  app.post("/api/bulk-uploads", upload.single('file'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = req.user as User;
      if (!['trader', 'garage'].includes(user.role)) {
        return res.status(403).json({ message: "Only traders and garages can perform bulk uploads" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Create bulk upload record
      const bulkUpload = await storage.createBulkUpload({
        userId: user.id,
        fileName: req.file.originalname,
      });

      // Process the file asynchronously
      processUploadedFile(req.file, bulkUpload.id, user.id).catch(console.error);

      res.status(201).json(bulkUpload);
    } catch (error) {
      console.error("Error handling bulk upload:", error);
      res.status(500).json({ message: "Failed to process bulk upload" });
    }
  });

  app.get("/api/bulk-uploads", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = req.user as User;
      const uploads = await storage.getBulkUploads(user.id);
      res.json(uploads);
    } catch (error) {
      console.error("Error fetching bulk uploads:", error);
      res.status(500).json({ message: "Failed to fetch bulk uploads" });
    }
  });

  return httpServer;
}

async function processUploadedFile(file: Express.Multer.File, uploadId: number, userId: number) {
  try {
    let vehicles: any[] = [];

    if (file.mimetype === 'text/csv') {
      // Process CSV file
      const parser = csv.parse({ columns: true, skip_empty_lines: true });
      vehicles = await new Promise((resolve, reject) => {
        const records: any[] = [];
        Readable.from(file.buffer)
          .pipe(parser)
          .on('data', (record) => records.push(record))
          .on('end', () => resolve(records))
          .on('error', reject);
      });
    } else {
      // Process Excel file
      const workbook = XLSX.read(file.buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      vehicles = XLSX.utils.sheet_to_json(worksheet);
    }

    // Update total count
    await storage.updateBulkUpload(uploadId, {
      status: "processing",
      totalVehicles: vehicles.length,
    });

    const errors: any[] = [];
    let processedCount = 0;

    // Process each vehicle
    for (const vehicleData of vehicles) {
      try {
        const result = insertVehicleSchema.safeParse({
          ...vehicleData,
          sellerId: userId,
          sellerType: vehicleData.sellerType || "trader",
        });

        if (result.success) {
          await storage.createVehicle(result.data);
          processedCount++;
        } else {
          errors.push({
            row: processedCount + 1,
            errors: result.error.errors,
          });
        }

        // Update progress
        await storage.updateBulkUpload(uploadId, {
          processedVehicles: processedCount,
        });
      } catch (error) {
        errors.push({
          row: processedCount + 1,
          error: error.message,
        });
      }
    }

    // Update final status
    await storage.updateBulkUpload(uploadId, {
      status: errors.length > 0 ? "completed_with_errors" : "completed",
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error processing bulk upload:", error);
    await storage.updateBulkUpload(uploadId, {
      status: "failed",
      errors: [{ error: error.message }],
    });
  }
}

//This is a placeholder;  You need to define the User interface yourself.
interface User {
  id: number;
  role: string;
}

//This is a placeholder; You'll need to implement this function in your codebase.
async function hashPassword(password: string): Promise<string> {
  //Implement your password hashing logic here.  For example, using bcrypt.
  return password; //REPLACE THIS WITH ACTUAL HASHING
}