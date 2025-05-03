import { Router } from "express";
import { hashPassword, comparePasswords } from "../utils/auth";
import { db } from "../db";
import { users, bids, vehicles, auctions, userReport, lisitngReport } from "../../shared/schema";
import { eq, or, sql, sum } from "drizzle-orm";

import { verifyToken } from "../middleware/authMiddleware";

const reportRouter = Router();


reportRouter.post(
  "/user",
  verifyToken,
  async (req, res) => {
    if (!req.userId )
      return res.status(401).json({ error: "unauthorized access" });

    const {
        userId,
        description,
    } = req.body; 
    if (!userId || !description) {
      return res.status(400).json({ error: "missing required fields" });
    }

    const [report] = await db.insert(userReport).values({    
        reported_for: userId,
        description: description,
        reported_by: req.userId,
    }).returning();

    return res.status(200).json({
        message: "report submitted successfully",
        reportId: report.id,
    });
  }
);

reportRouter.post(
    "/listing",
    verifyToken,
    async (req, res) => {
      if (!req.userId )
        return res.status(401).json({ error: "unauthorized access" });
  
      const {
          vehicleId,
          auctionId,
          description,
      } = req.body; 
      if (!(vehicleId || auctionId ) || !description) {
        return res.status(400).json({ error: "missing required fields" });
      }
      console.log(vehicleId, auctionId, description);
      const reportData: any = {
        description: description,
        reported_by: req.userId,
      };
      if (vehicleId) {
        reportData.reported_vehicle = vehicleId;
      } else if (auctionId) {
        reportData.reported_auction = auctionId;
      }

      const [report] = await db.insert(lisitngReport).values(reportData).returning();
  
      return res.status(200).json({
          message: "report submitted successfully",
          reportId: report.id,
      });
    }
  );

// Export the router
export default reportRouter;
