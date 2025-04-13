import type { Express, NextFunction } from "express";
import { createServer as createHttpServer } from "http";
import { createServer as createHttpsServer } from "https";
import { readFileSync } from "fs";
import { join } from "path";
import { storage } from "./storage";
import {
  searchSchema,
  insertVehicleSchema,
  insertAuctionSchema,
  insertEventSchema,
  insertFeedbackSchema,
  insertSparePartSchema,
  insertInventorySchema,
  insertOfferSchema,
  insertPricingPlanSchema,
} from "../shared/schema";
import { setupAuth } from "./auth";
import axios from "axios";

// Middleware to check if user is admin
const isAdmin = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied. Admin privileges required." });
  }
  next();
};

export async function registerRoutes(app: Express) {
  // Create server based on environment
  let httpServer;

  // Use HTTP in development
  httpServer = createHttpServer(app);
  console.log("HTTP server created for development");

  // Set up authentication routes and middleware
  await setupAuth(app);

  // Get all vehicles with optional category filter
  // app.get("/api/vehicles", async (req, res) => {
  //   const category = req.query.category as string | undefined;
  //   const vehicles = await storage.getVehicles(category);
  //   res.json(vehicles);
  // });

  // Get single vehicle by ID
  // app.get("/api/vehicles/:id", async (req, res) => {
  //   const id = Number(req.params.id);
  //   if (isNaN(id)) {
  //     return res.status(400).json({ message: "Invalid vehicle ID" });
  //   }

  //   const vehicle = await storage.getVehicle(id);
  //   if (!vehicle) {
  //     return res.status(404).json({ message: "Vehicle not found" });
  //   }

  //   res.json(vehicle);
  // });

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
      minPrice: req.query.minPrice
        ? parseInt(req.query.minPrice as string)
        : undefined,
      maxPrice: req.query.maxPrice
        ? parseInt(req.query.maxPrice as string)
        : undefined,
      make: req.query.make,
      bodyType: req.query.bodyType,
    });

    if (!result.success) {
      return res.status(400).json({ message: "Invalid search parameters" });
    }

    const vehicles = await storage.searchVehicles(result.data);
    res.json(vehicles);
  });

  // Update vehicle lookup endpoint to use axios
  app.post("/api/vehicles/lookup", isAdmin, async (req, res) => {
    try {
      const { registrationNumber } = req.body;

      if (!process.env.DVSA_API_KEY) {
        return res.status(500).json({ message: "DVSA API key not configured" });
      }

      const response = await axios.post(
        "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
        { registrationNumber },
        {
          headers: {
            "x-api-key": process.env.DVSA_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      const data: any = response.data;

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
        role,
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
        role,
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
          return res
            .status(400)
            .json({ message: "Cannot delete the last admin user" });
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
  const checkPermission = async (req: any, res: any, next: NextFunction) => {
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
      case "post":
        action = "create";
        break;
      case "get":
        action = "read";
        break;
      case "patch":
      case "put":
        action = "update";
        break;
      case "delete":
        action = "delete";
        break;
      default:
        return res.status(405).json({ message: "Method not allowed" });
    }

    const hasPermission = await storage.checkPermission(
      user.role,
      path,
      action
    );
    if (!hasPermission) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };

  // Replace isAdmin middleware with checkPermission where appropriate
  app.use("/api/:resource", checkPermission);

  // Bulk upload routes (trader/garage only)
  app.post("/api/bulk-uploads", upload.single("file"), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = req.user as User;
      if (!["trader", "garage"].includes(user.role)) {
        return res.status(403).json({
          message: "Only traders and garages can perform bulk uploads",
        });
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
      processUploadedFile(req.file, bulkUpload.id, user.id).catch(
        console.error
      );

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

  // Add to the existing routes file, after the existing routes
  app.get("/api/packages", async (req, res) => {
    try {
      const packages = await storage.getPackages();
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  app.post("/api/user-packages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userPackage = await storage.createUserPackage({
        ...req.body,
        userId: req.user.id,
        startDate: new Date().toISOString(),
        endDate: new Date(
          Date.now() + req.body.duration * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
      res.status(201).json(userPackage);
    } catch (error) {
      console.error("Error creating user package:", error);
      res.status(500).json({ message: "Failed to create user package" });
    }
  });

  app.get("/api/user-packages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userPackages = await storage.getUserPackages(req.user.id);
      res.json(userPackages);
    } catch (error) {
      console.error("Error fetching user packages:", error);
      res.status(500).json({ message: "Failed to fetch user packages" });
    }
  });

  // Auctions routes
  app.get("/api/auctions", async (req, res) => {
    try {
      const auctions = await storage.getAuctions();
      res.json(auctions);
    } catch (error) {
      console.error("Error fetching auctions:", error);
      res.status(500).json({ message: "Failed to fetch auctions" });
    }
  });

  app.post("/api/auctions", isAdmin, async (req, res) => {
    try {
      console.log("Auction creation request payload:", req.body);

      const result = insertAuctionSchema.safeParse(req.body);
      if (!result.success) {
        console.error("Auction validation errors:", result.error.errors);
        return res.status(400).json({
          message: "Invalid auction data",
          errors: result.error.errors,
        });
      }

      try {
        // Format and validate the auction data
        const auctionData = {
          ...result.data,
          // Ensure dates are in proper format
          startDate: new Date(result.data.startDate).toISOString(),
          endDate: new Date(result.data.endDate).toISOString(),
          // Set default values
          currentBid: result.data.startingPrice,
          totalBids: 0,
          status: result.data.status || "upcoming",
        };

        console.log("Creating auction with data:", auctionData);

        const auction = await storage.createAuction(auctionData);
        res.status(201).json(auction);
      } catch (error) {
        console.error("Error creating auction:", error);
        res
          .status(500)
          .json({ message: "Failed to create auction in database" });
      }
    } catch (error) {
      console.error("Unexpected error in auction creation:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Feedback routes
  app.get("/api/feedbacks", async (req, res) => {
    try {
      const feedbacks = await storage.getFeedbacks();
      res.json(feedbacks);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      res.status(500).json({ message: "Failed to fetch feedbacks" });
    }
  });

  app.post("/api/feedbacks", async (req, res) => {
    try {
      const result = insertFeedbackSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid feedback data" });
      }

      const feedback = await storage.createFeedback(result.data);
      res.status(201).json(feedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  // Event routes
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post("/api/events", isAdmin, async (req, res) => {
    try {
      console.log("Event creation request payload:", req.body);

      const result = insertEventSchema.safeParse(req.body);
      if (!result.success) {
        console.error("Event validation errors:", result.error.errors);
        return res.status(400).json({
          message: "Invalid event data",
          errors: result.error.errors,
        });
      }

      try {
        // Format and validate the event data
        const eventData = {
          ...result.data,
          // Ensure date is in proper format
          date: new Date(result.data.date).toISOString(),
          // Set default values
          registeredCount: 0,
          status: result.data.status || "upcoming",
        };

        const event = await storage.createEvent(eventData);
        res.status(201).json(event);
      } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ message: "Failed to create event in database" });
      }
    } catch (error) {
      console.error("Unexpected error in event creation:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Spare Parts routes
  app.get("/api/spare-parts", async (req, res) => {
    try {
      const spareParts = await storage.getSpareParts();
      res.json(spareParts);
    } catch (error) {
      console.error("Error fetching spare parts:", error);
      res.status(500).json({ message: "Failed to fetch spare parts" });
    }
  });

  app.post("/api/spare-parts", isAdmin, async (req, res) => {
    try {
      const result = insertSparePartSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid spare part data" });
      }

      const sparePart = await storage.createSparePart(result.data);
      res.status(201).json(sparePart);
    } catch (error) {
      console.error("Error creating spare part:", error);
      res.status(500).json({ message: "Failed to create spare part" });
    }
  });

  // Inventory routes
  app.get("/api/inventory", async (req, res) => {
    try {
      const inventory = await storage.getInventory();
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.post("/api/inventory", isAdmin, async (req, res) => {
    try {
      const result = insertInventorySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid inventory data" });
      }

      const item = await storage.createInventoryItem(result.data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  // Offer routes
  app.get("/api/offers", async (req, res) => {
    try {
      const offers = await storage.getOffers();
      res.json(offers);
    } catch (error) {
      console.error("Error fetching offers:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  app.post("/api/offers", isAdmin, async (req, res) => {
    try {
      const result = insertOfferSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid offer data" });
      }

      const offer = await storage.createOffer(result.data);
      res.status(201).json(offer);
    } catch (error) {
      console.error("Error creating offer:", error);
      res.status(500).json({ message: "Failed to create offer" });
    }
  });

  // Pricing Plan routes
  app.get("/api/pricing-plans", async (req, res) => {
    try {
      const plans = await storage.getPricingPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching pricing plans:", error);
      res.status(500).json({ message: "Failed to fetch pricing plans" });
    }
  });

  app.post("/api/pricing-plans", isAdmin, async (req, res) => {
    try {
      const result = insertPricingPlanSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid pricing plan data" });
      }

      const plan = await storage.createPricingPlan(result.data);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating pricing plan:", error);
      res.status(500).json({ message: "Failed to create pricing plan" });
    }
  });

  return httpServer;
}

async function processUploadedFile(
  file: Express.Multer.File,
  uploadId: number,
  userId: number
) {
  try {
    let vehicles: any[] = [];

    if (file.mimetype === "text/csv") {
      // Process CSV file
      const parser = csv.parse({ columns: true, skip_empty_lines: true });
      vehicles = await new Promise((resolve, reject) => {
        const records: any[] = [];
        Readable.from(file.buffer)
          .pipe(parser)
          .on("data", (record) => records.push(record))
          .on("end", () => resolve(records))
          .on("error", reject);
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
      } catch (error: any) {
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
  } catch (error: any) {
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
import multer from "multer";
import * as csv from "csv-parse";
import * as XLSX from "xlsx";
import { Readable } from "stream";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});
