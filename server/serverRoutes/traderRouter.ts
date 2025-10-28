import { Router } from "express";
import { db } from "../db";
import { traderRequests, users } from "../../shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { verifyToken } from "../middleware/authMiddleware";
import { RedisService } from "../services/RedisService";

const traderRouter = Router();

// User submits trader request
traderRouter.post("/request", verifyToken, async (req, res) => {
  try {
    const { ukCompanyName, ukCompanyNumber } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate required fields
    if (!ukCompanyName || !ukCompanyNumber) {
      return res.status(400).json({ 
        error: "UK Company Name and UK Company Number are required" 
      });
    }

    // Check if user is already a trader or admin
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === "trader" || user.role === "admin") {
      return res.status(400).json({ 
        error: "You already have trader access" 
      });
    }

    // Check if there's already a pending request
    const existingRequest = await db.select().from(traderRequests).where(and(
      eq(traderRequests.userId, userId),
      eq(traderRequests.status, "PENDING")
    )).limit(1);

    if (existingRequest.length > 0) {
      return res.status(400).json({ 
        error: "You already have a pending trader request" 
      });
    }

    // Create new trader request
    const [newRequest] = await db.insert(traderRequests).values({
      userId,
      ukCompanyName,
      ukCompanyNumber,
      status: "PENDING",
    }).returning();

    // Invalidate cache for trader requests
    // await RedisService.getCache("trader-requests:pending");

    res.status(201).json(newRequest);
  } catch (error) {
    console.error("Error creating trader request:", error);
    res.status(500).json({ error: "Failed to submit trader request" });
  }
});

// Get user's own trader request
traderRouter.get("/my-request", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const allRequests = await db
      .select()
      .from(traderRequests)
      .where(eq(traderRequests.userId, userId))
      .orderBy(desc(traderRequests.submittedAt))
      .limit(1);

    if (allRequests.length === 0) {
      return res.status(404).json({ error: "No trader request found" });
    }

    res.json(allRequests[0]);
  } catch (error) {
    console.error("Error fetching trader request:", error);
    res.status(500).json({ error: "Failed to fetch trader request" });
  }
});

export default traderRouter;
