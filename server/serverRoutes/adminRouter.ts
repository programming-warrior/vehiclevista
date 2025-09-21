import { Router } from "express";
import { hashPassword, comparePasswords } from "../utils/auth";
import { db } from "../db";
import {
  users,
  bids,
  vehicles,
  auctions,
  lisitngReport,
  platformSummaryHistory,
  vehicleMetricsHistory,
  auctionMetricsHistory,
  raffle,
  raffleTicketSale,
  auctionWinner,
  auctionStatus,
  paymentSession,
  packages,
  contactAttempts,
  adminIpLogs,
} from "../../shared/schema";
import {
  eq,
  or,
  sql,
  sum,
  aliasedTable,
  like,
  isNotNull,
  ilike,
  and,
  gte,
  not,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { raffleQueue } from "../worker/queue";

// import { notEq } from "drizzle-orm/pg-core";

import { verifyToken } from "../middleware/authMiddleware";
import { z } from "zod";
import { parse } from "path";

// --- Place these at the top of your file or in a shared location ---
const vehicleTypes = ["car", "bike", "truck", "van"] as const;
const vehicleConditions = ["clean", "catS", "catN"] as const;

const vehicleFormSchema = z.object({
  type: z.enum(vehicleTypes, { required_error: "Type is required" }),
  make: z.string().min(1, { message: "Make is required" }),
  model: z.string().min(1, { message: "Model is required" }),
  registration_num: z
    .string()
    .min(1, { message: "Registration number is required" }),
  price: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Price must be a valid number",
  }),
  year: z.string().refine((val) => !isNaN(parseInt(val)), {
    message: "Year must be a valid number",
  }),
  mileage: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Mileage must be a valid number",
  }),
  // title: z.string().min(1, { message: "Title is required" }),
  fuelType: z.string().min(1, { message: "Fuel type is required" }),
  transmission: z.string().min(1, { message: "Transmission is required" }),
  bodyType: z.string().min(1, { message: "Body type is required" }),
  color: z.string().min(1, { message: "Color is required" }),
  // description: z.string().min(1, { message: "Description is required" }),
  location: z.string().min(1, { message: "Location is required" }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  images: z.array(z.string()),
  // condition: z.enum(vehicleConditions, {
  //   required_error: "Condition is required",
  // }),
});

const raffleFormSchema = z
  .object({
    vehicleId: z.string().optional(),
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid start date",
    }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid end date",
    }),
    ticketPrice: z.number().min(1, "Ticket price must be at least 1"),
    ticketQuantity: z.number().int().min(10, "Minimum 10 tickets required"),
    featured: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (start < new Date()) {
      ctx.addIssue({
        path: ["startDate"],
        code: z.ZodIssueCode.custom,
        message: "Raffle start time cannot be in the past",
      });
    }
    if (end <= start) {
      ctx.addIssue({
        path: ["endDate"],
        code: z.ZodIssueCode.custom,
        message: "Raffle end time must be after start time",
      });
    }
  });

const adminRouter = Router();

interface TopListingType {
  vehicleId: number;
  auctionId?: number;
  title: string;
  description: string;
  clicks: number;
  views: number;
  image_url: string;
  type: "vehicle" | "auction";
  sellerId: number;
  sellerUsername: string;
  sellerEmail: string;
  createdAt: string;
  price: number;
  make: string;
  model: string;
  year: number;
};

adminRouter.post("/keep-alive", verifyToken, (req, res) => {
  return res.json({ ok: true });
});

adminRouter.get("/logs/login", verifyToken, async (req, res) => {
  if (!req.userId || req.role !== "admin") {
    return res.status(401).json({ error: "unauthorized access" });
  }

  try {
    const { page, limit, filter } = req.query;
    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    // Parse filter object
    let filterOptions: any = {};
    let searchTerm = "";
    let statusFilter = "";

    if (filter) {
      try {
        filterOptions = JSON.parse(filter as string);
        searchTerm = filterOptions.search?.trim() || "";
        statusFilter = filterOptions.status?.toLowerCase() || "";
      } catch (error) {
        console.error("Error parsing filter:", error);
      }
    }

    // Build WHERE conditions dynamically
    const conditions: any[] = [];

    // Search filter (search IP or user email)
    if (searchTerm) {
      conditions.push(
        or(
          ilike(adminIpLogs.ipAddress, `%${searchTerm}%`),
          ilike(adminIpLogs.locationCity, `%${searchTerm}%`),
          ilike(adminIpLogs.locationCountry, `%${searchTerm}%`)
        )
      );
    }

    // Status filter
    if (statusFilter === "success" || statusFilter === "failed") {
      conditions.push(eq(adminIpLogs.status, statusFilter));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Get paginated results
    const logs = await db
      .select()
      .from(adminIpLogs)
      .where(whereCondition)
      .orderBy(sql`created_at DESC`)
      .limit(limitNumber)
      .offset(offset);

    // Get total count for pagination UI
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(adminIpLogs)
      .where(whereCondition);

    return res.json({
      page: pageNumber,
      totalPages: Math.ceil(count/limitNumber),
      totalLogs: count,
      logs: logs,
    });

  } catch (e) {
    console.error("Error fetching admin login logs:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

adminRouter.get("/analytics/patterns", verifyToken, async (req, res) => {
  if (!req.userId || req.role !== "admin") {
    return res.status(401).json({ error: "unauthorized access" });
  }

  const { searchBy } = req.query;
  let pastDate = new Date();

  switch (searchBy) {
    case "month":
      pastDate.setMonth(pastDate.getMonth() - 1);
      break;
    case "year":
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      break;
    case "week":
    default:
      pastDate.setDate(pastDate.getDate() - 7);
      break;
  }

  try {
    // Select all columns to ensure we have all the data we need
    const historicalData = await db
      .select()
      .from(platformSummaryHistory)
      .where(gte(platformSummaryHistory.recorded_at, pastDate))
      .orderBy(platformSummaryHistory.recorded_at);

    // We need at least two data points to calculate growth
    if (historicalData.length < 2) {
      return res.status(404).json({
        error:
          "Not enough historical data to generate patterns for the selected period.",
      });
    }

    const firstPoint = historicalData[0];
    const lastPoint = historicalData[historicalData.length - 1];

    const calculateGrowth = (current: number, past: number) => {
      if (past === 0) return current > 0 ? 100 : 0; // Avoid division by zero
      return ((current - past) / past) * 100;
    };

    // A helper to create the chart data structure
    const createChartData = (keys: { name: string; data: number[] }[]) => {
      const datasets: { [key: string]: number[] } = {};
      keys.forEach((k) => {
        datasets[k.name] = k.data;
      });
      return {
        labels: historicalData.map((d) =>
          d.recorded_at.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        ),
        datasets,
      };
    };

    const responsePayload = {
      // --- OVERALL DATA ---
      overall: {
        summary: {
          totalViews:
            lastPoint.total_vehicle_views + lastPoint.total_auction_views,
          viewsGrowth: calculateGrowth(
            lastPoint.total_vehicle_views + lastPoint.total_auction_views,
            firstPoint.total_vehicle_views + firstPoint.total_auction_views
          ),
          totalClicks:
            lastPoint.total_vehicle_clicks + lastPoint.total_auction_clicks,
          clicksGrowth: calculateGrowth(
            lastPoint.total_vehicle_clicks + lastPoint.total_auction_clicks,
            firstPoint.total_vehicle_clicks + firstPoint.total_auction_clicks
          ),
          totalUsers: lastPoint.total_users,
          userGrowth: calculateGrowth(
            lastPoint.total_users,
            firstPoint.total_users
          ),
          totalListings: lastPoint.total_vehicles + lastPoint.total_auctions,
        },
        chartData: createChartData([
          {
            name: "Views",
            data: historicalData.map(
              (d) => d.total_vehicle_views + d.total_auction_views
            ),
          },
          {
            name: "Clicks",
            data: historicalData.map(
              (d) => d.total_vehicle_clicks + d.total_auction_clicks
            ),
          },
        ]),
      },
      // --- VEHICLE-ONLY DATA ---
      vehicle: {
        summary: {
          totalViews: lastPoint.total_vehicle_views,
          viewsGrowth: calculateGrowth(
            lastPoint.total_vehicle_views,
            firstPoint.total_vehicle_views
          ),
          totalClicks: lastPoint.total_vehicle_clicks,
          clicksGrowth: calculateGrowth(
            lastPoint.total_vehicle_clicks,
            firstPoint.total_vehicle_clicks
          ),
          totalListings: lastPoint.total_vehicles,
        },
        chartData: createChartData([
          {
            name: "Views",
            data: historicalData.map((d) => d.total_vehicle_views),
          },
          {
            name: "Clicks",
            data: historicalData.map((d) => d.total_vehicle_clicks),
          },
        ]),
      },
      // --- AUCTION-ONLY DATA ---
      auction: {
        summary: {
          totalViews: lastPoint.total_auction_views,
          viewsGrowth: calculateGrowth(
            lastPoint.total_auction_views,
            firstPoint.total_auction_views
          ),
          totalClicks: lastPoint.total_auction_clicks,
          clicksGrowth: calculateGrowth(
            lastPoint.total_auction_clicks,
            firstPoint.total_auction_clicks
          ),
          totalListings: lastPoint.total_auctions,
        },
        chartData: createChartData([
          {
            name: "Views",
            data: historicalData.map((d) => d.total_auction_views),
          },
          {
            name: "Clicks",
            data: historicalData.map((d) => d.total_auction_clicks),
          },
        ]),
      },
    };

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Failed to fetch analytics patterns:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// adminRouter.get(
//   "/analytics/performance-metrics",
//   verifyToken,
//   async (req, res) => {
//     if (!req.userId || req.role !== "admin")
//       return res.status(401).json({ error: "unauthorized access" });

//     const { searchBy } = req.query;

//     let pastDate = new Date();

//     if (searchBy === "week") {
//       pastDate.setDate(pastDate.getDate() - 7);
//     } else if (searchBy === "month") {
//       pastDate.setMonth(pastDate.getMonth() - 1);
//     } else if (searchBy === "year") {
//       pastDate.setFullYear(pastDate.getFullYear() - 1);
//     } else {
//       pastDate.setDate(pastDate.getDate() - 7);
//     }

//     const pastVehicleMetric = await db
//       .select({
//         views: sum(vehicleMetricsHistory.views).mapWith(Number),
//         clicks: sum(vehicleMetricsHistory.clicks).mapWith(Number),
//         leads: sum(vehicleMetricsHistory.leads).mapWith(Number),
//       })
//       .from(vehicleMetricsHistory)
//       .where(sql`recorded_at <= ${pastDate}`);

//     const pastAuctionMetric = await db
//       .select({
//         views: sum(auctionMetricsHistory.views).mapWith(Number),
//         clicks: sum(auctionMetricsHistory.clicks).mapWith(Number),
//         leads: sum(auctionMetricsHistory.leads).mapWith(Number),
//       })
//       .from(vehicleMetricsHistory)
//       .where(sql`recorded_at <= ${pastDate}`);

//     const vehicleTotals = await db
//       .select({
//         count: sql<number>`count(*)`,
//         views: sum(vehicles.views).mapWith(Number),
//         clicks: sum(vehicles.clicks).mapWith(Number),
//       })
//       .from(vehicles)
//       .execute()
//       .then((rows) => rows[0] || { views: 0, clicks: 0 });
//     const auctionTotals = await db
//       .select({
//         count: sql<number>`count(*)`,
//         views: sum(auctions.views).mapWith(Number),
//         clicks: sum(auctions.clicks).mapWith(Number),
//       })
//       .from(auctions)
//       .execute()
//       .then((rows) => rows[0] || { views: 0, clicks: 0 });

//     const [{ count: totalUsers }] = await db
//       .select({
//         count: sql<number>`count(*)`,
//       })
//       .from(users);

//     const performanceMetrics = {
//       vehicleViewsGrowth:
//         ((vehicleTotals.views - pastVehicleMetric[0].views) /
//           (pastVehicleMetric[0].views || 1)) *
//         100,
//       vehicleClicksGrowth:
//         ((vehicleTotals.clicks - pastVehicleMetric[0].clicks) /
//           (pastVehicleMetric[0].clicks || 1)) *
//         100,
//       auctionViewsGrowth:
//         ((auctionTotals.views - pastAuctionMetric[0].views) /
//           (pastAuctionMetric[0].views || 1)) *
//         100,
//       auctionClicksGrowth:
//         ((auctionTotals.clicks - pastAuctionMetric[0].clicks) /
//           (pastAuctionMetric[0].clicks || 1)) *
//         100,
//       totalUsers: totalUsers,
//       totalVehicles: vehicleTotals.count,
//       totalAuctions: auctionTotals.count,
//       vehicleTotalViews: vehicleTotals.views,
//       vehicleTotalClicks: vehicleTotals.clicks,
//       auctionTotalViews: auctionTotals.views,
//       auctionTotalClicks: auctionTotals.clicks,
//       vehicleTotalLeads: 0,
//       auctionTotalLeads: 0,
//     };

//     return res.status(200).json(performanceMetrics);
//   }
// );

adminRouter.get("/analytics/top-listings", verifyToken, async (req, res) => {
  if (!req.userId || req.role !== "admin")
    return res.status(401).json({ error: "unauthorized access" });

  //fetch top 5 vehicles and auctions based on views and clicks
  const topVehicles = await db
    .select({
      vehicles,
      users,
    })
    .from(vehicles)
    .innerJoin(users, eq(vehicles.sellerId, users.id))
    .orderBy(sql`${vehicles.clicks} DESC,  ${vehicles.views} DESC`)
    .limit(5);

  const topAuctions = await db
    .select({
      auctions,
      users,
      vehicles,
    })
    .from(auctions)
    .innerJoin(users, eq(auctions.sellerId, users.id))
    .innerJoin(vehicles, eq(auctions.itemId, vehicles.id))
    .orderBy(sql`${auctions.clicks} DESC, ${auctions.views} DESC`)
    .limit(5);

  let vehicleIdx = 0;
  let auctionIdx = 0;
  let topListings: TopListingType[] = [];
  while (vehicleIdx < topVehicles.length && auctionIdx < topAuctions.length) {
    if (
      (topVehicles[vehicleIdx].vehicles?.clicks ?? 0) >
      (topAuctions[auctionIdx].auctions?.clicks ?? 0)
    ) {
      topListings.push({
        vehicleId: topVehicles[vehicleIdx].vehicles?.id ?? 0,
        title: topVehicles[vehicleIdx].vehicles?.title,
        clicks: topVehicles[vehicleIdx].vehicles?.clicks ?? 0,
        views: topVehicles[vehicleIdx].vehicles?.views ?? 0,
        type: "vehicle",
        sellerId: topVehicles[vehicleIdx].users.id ?? 0,
        image_url: topVehicles[vehicleIdx].vehicles?.images[0],
        sellerUsername: topVehicles[vehicleIdx].users.username,
        sellerEmail: topVehicles[vehicleIdx].users.email,
        createdAt:
          topVehicles[vehicleIdx].vehicles?.createdAt?.toString() ??
          Date.now().toString(),
        description: topVehicles[vehicleIdx].vehicles?.description,
        price: topVehicles[vehicleIdx].vehicles?.price,
        make: topVehicles[vehicleIdx].vehicles?.make,
        model: topVehicles[vehicleIdx].vehicles?.model,
        year: topVehicles[vehicleIdx].vehicles?.year,
      });
      vehicleIdx++;
    } else if (
      (topVehicles[vehicleIdx].vehicles?.clicks ?? 0) ===
        (topAuctions[auctionIdx].auctions?.clicks ?? 0) &&
      (topVehicles[vehicleIdx].vehicles?.views ?? 0) >=
        (topAuctions[auctionIdx].auctions?.views ?? 0)
    ) {
      topListings.push({
        vehicleId: topVehicles[vehicleIdx].vehicles?.id ?? 0,
        make: topVehicles[vehicleIdx].vehicles?.make,
        model: topVehicles[vehicleIdx].vehicles?.model,
        year: topVehicles[vehicleIdx].vehicles?.year,
        title: topVehicles[vehicleIdx].vehicles?.title,
        clicks: topVehicles[vehicleIdx].vehicles?.clicks ?? 0,
        views: topVehicles[vehicleIdx].vehicles?.views ?? 0,
        image_url: topVehicles[vehicleIdx].vehicles?.images[0],
        type: "vehicle",
        sellerId: topVehicles[vehicleIdx].users.id,
        sellerUsername: topVehicles[vehicleIdx].users.username,
        sellerEmail: topVehicles[vehicleIdx].users.email,
        createdAt:
          topVehicles[vehicleIdx].vehicles?.createdAt?.toString() ??
          Date.now().toString(),
        description: topVehicles[vehicleIdx].vehicles?.description,
        price: topVehicles[vehicleIdx].vehicles?.price,
      });
      vehicleIdx++;
    } else {
      topListings.push({
        auctionId: topAuctions[auctionIdx].auctions?.id,
        make: topVehicles[auctionIdx].vehicles?.make,
        model: topVehicles[auctionIdx].vehicles?.model,
        year: topVehicles[auctionIdx].vehicles?.year,
        title: topAuctions[auctionIdx].auctions?.title,
        clicks: topAuctions[auctionIdx].auctions?.clicks ?? 0,
        views: topAuctions[auctionIdx].auctions?.views ?? 0,
        type: "auction",
        sellerId: topAuctions[auctionIdx].users.id,
        sellerUsername: topAuctions[auctionIdx].users.username,
        sellerEmail: topAuctions[auctionIdx].users.email,
        createdAt:
          topAuctions[auctionIdx].auctions?.createdAt?.toString() ??
          Date.now().toString(),
        description: topAuctions[auctionIdx].auctions?.description,
        image_url: topVehicles[auctionIdx].vehicles?.images[0],
        price: topAuctions[auctionIdx].auctions?.startingPrice,
        vehicleId: topAuctions[auctionIdx].vehicles.id,
      });
    }
  }

  if (auctionIdx < topAuctions.length) {
    for (let i = auctionIdx; i < topAuctions.length; i++) {
      topListings.push({
        auctionId: topAuctions[i].auctions?.id,
        make: topVehicles[i].vehicles?.make,
        model: topVehicles[i].vehicles?.model,
        year: topVehicles[i].vehicles?.year,
        title: topAuctions[i].auctions?.title,
        clicks: topAuctions[i].auctions?.clicks ?? 0,
        views: topAuctions[i].auctions?.views ?? 0,
        type: "auction",
        sellerId: topAuctions[i].users.id,
        sellerUsername: topAuctions[i].users.username,
        sellerEmail: topAuctions[i].users.email,
        createdAt:
          topAuctions[i].auctions?.createdAt?.toString() ??
          Date.now().toString(),
        description: topAuctions[i].auctions?.description,
        image_url: topVehicles[i].vehicles?.images[0],
        price: topAuctions[i].auctions?.startingPrice,
        vehicleId: topAuctions[i].vehicles.id,
      });
    }
  }

  if (vehicleIdx < topVehicles.length) {
    for (let i = vehicleIdx; i < topVehicles.length; i++) {
      topListings.push({
        vehicleId: topVehicles[i].vehicles?.id ?? 0,
        title: topVehicles[i].vehicles?.title,
        clicks: topVehicles[i].vehicles?.clicks ?? 0,
        views: topVehicles[i].vehicles?.views ?? 0,
        type: "vehicle",
        sellerId: topVehicles[i].users.id ?? 0,
        image_url: topVehicles[i].vehicles?.images[0],
        sellerUsername: topVehicles[i].users.username,
        sellerEmail: topVehicles[i].users.email,
        createdAt:
          topVehicles[i].vehicles?.createdAt?.toString() ??
          Date.now().toString(),
        description: topVehicles[i].vehicles?.description,
        price: topVehicles[i].vehicles?.price,
        make: topVehicles[i].vehicles?.make,
        model: topVehicles[i].vehicles?.model,
        year: topVehicles[i].vehicles?.year,
      });
    }
  }

  return res.status(200).json(topListings);
});

adminRouter.put("/black-list/users/:userId", verifyToken, async (req, res) => {
  if (!req.userId || req.role !== "admin")
    return res.status(401).json({ error: "unauthorized access" });
  let { userId }: any = req.params;
  const { reason } = req.body;
  userId = parseInt(userId as string);

  if (!userId || !reason || isNaN(userId)) {
    return res.status(400).json({ error: "missing required fields" });
  }
  const [user] = await db
    .update(users)
    .set({
      status: "blacklisted",
      blacklistReason: reason,
    })
    .where(eq(users.id, userId))
    .returning()
    .execute();
  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }
  return res.status(200).json({
    message: "user blacklisted successfully",
    userId: user.id,
  });
});

adminRouter.put(
  "/black-list/vehicles/:vehicleId",
  verifyToken,
  async (req, res) => {
    if (!req.userId || req.role !== "admin")
      return res.status(401).json({ error: "unauthorized access" });
    let { vehicleId }: any = req.params;
    const { reason } = req.body;
    vehicleId = parseInt(vehicleId as string);

    if (!vehicleId || !reason || isNaN(vehicleId)) {
      return res.status(400).json({ error: "missing required fields" });
    }
    const [vehicle] = await db
      .update(vehicles)
      .set({
        listingStatus: "BLACKLISTED",
        blacklistReason: reason,
      })
      .where(eq(vehicles.id, vehicleId))
      .returning()
      .execute();
    if (!vehicle) {
      return res.status(404).json({ error: "vehicle not found" });
    }
    return res.status(200).json({
      message: "vehicle blacklisted successfully",
      vehicleId: vehicle.id,
    });
  }
);

adminRouter.put(
  "/un-black-list/users/:userId",
  verifyToken,
  async (req, res) => {
    if (!req.userId || req.role !== "admin")
      return res.status(401).json({ error: "unauthorized access" });
    let { userId }: any = req.params;
    const { reason } = req.body;
    userId = parseInt(userId as string);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: "missing required fields" });
    }
    const [user] = await db
      .update(users)
      .set({
        status: "active",
        blacklistReason: null,
      })
      .where(eq(users.id, userId))
      .returning()
      .execute();
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }
    return res.status(200).json({
      message: "user unblacklisted successfully",
      userId: user.id,
    });
  }
);

adminRouter.put(
  "/un-black-list/vehicles/:vehicleId",
  verifyToken,
  async (req, res) => {
    if (!req.userId || req.role !== "admin")
      return res.status(401).json({ error: "unauthorized access" });
    let { vehicleId }: any = req.params;
    const { reason } = req.body;
    vehicleId = parseInt(vehicleId as string);

    if (!vehicleId || isNaN(vehicleId)) {
      return res.status(400).json({ error: "missing required fields" });
    }
    const [vehicle] = await db
      .update(vehicles)
      .set({
        listingStatus: "ACTIVE",
        blacklistReason: null,
      })
      .where(eq(vehicles.id, vehicleId))
      .returning()
      .execute();
    if (!vehicle) {
      return res.status(404).json({ error: "vehicle not found" });
    }
    return res.status(200).json({
      message: "vehicle unblacklisted successfully",
      vehicleId: vehicle.id,
    });
  }
);

adminRouter.get("/users", verifyToken, async (req, res) => {
  if (!req.userId || req.role !== "admin")
    return res.status(401).json({ error: "unauthorized access" });

  const { page, limit, sortBy, filter } = req.query;
  const pageNumber = parseInt(page as string) || 1;
  const limitNumber = parseInt(limit as string) || 10;
  const offset = (pageNumber - 1) * limitNumber;

  // Parse filter if provided
  let filterOptions: any = {};
  let searchTerm = "";
  let statusFilter = null;

  console.log(filter);
  console.log(page);
  console.log(limit);

  if (filter) {
    try {
      filterOptions = JSON.parse(filter as string);
      searchTerm = filterOptions.search || "";
      statusFilter = filterOptions.status || null;
      statusFilter = statusFilter.toLowerCase();
    } catch (error) {
      console.error("Error parsing filter:", error);
    }
  }

  // Determine sort order
  let orderByClause = sql`${users.createdAt} DESC`;

  if (sortBy === "oldest") {
    orderByClause = sql`${users.createdAt} ASC`;
  } else if (sortBy === "reports") {
    orderByClause = sql`reports_count DESC`;
  } else if (sortBy === "bids") {
    orderByClause = sql`bids_count DESC`;
  } else if (sortBy === "auctions") {
    orderByClause = sql`auctions_count DESC`;
  } else if (sortBy === "vehicles") {
    orderByClause = sql`vehicles_count DESC`;
  }

  // Set up query
  const lr1 = alias(lisitngReport, "lr1");
  const lr2 = alias(lisitngReport, "lr2");

  // Base query
  let query = db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      card: users.card,
      status: users.status,
      blacklistReason: users.blacklistReason,
      auctions_count: sql<number>`COUNT(DISTINCT ${auctions.id})`.as(
        "auctions_count"
      ),
      vehicles_count: sql<number>`COUNT(DISTINCT ${vehicles.id})`.as(
        "vehicles_count"
      ),
      bids_count: sql<number>`COUNT(DISTINCT ${bids.id})`.as("bids_count"),
      reports_count:
        sql<number>`COALESCE(COUNT(DISTINCT ${lr1.id}),0) + COALESCE(COUNT(DISTINCT ${lr2.id}),0)`.as(
          "reports_count"
        ),
    })
    .from(users)
    .leftJoin(auctions, eq(users.id, auctions.sellerId))
    .leftJoin(vehicles, eq(users.id, vehicles.sellerId))
    .leftJoin(bids, eq(users.id, bids.userId))
    .leftJoin(lr1, eq(auctions.id, lr1.reported_auction))
    .leftJoin(lr2, eq(vehicles.id, lr2.reported_vehicle));

  // Add search conditions if needed
  if (searchTerm) {
    query.where(
      or(
        ilike(users.username, `%${searchTerm}%`),
        ilike(users.email, `%${searchTerm}%`)
      )
    );
  }

  // Add status filter if needed
  if (statusFilter) {
    query.where(eq(users.status, statusFilter));
  }

  try {
    // Complete the query with grouping, ordering, and pagination
    const result = await query
      .groupBy(
        users.id,
        users.username,
        users.email,
        users.role,
        users.createdAt,
        users.card,
        users.status,
        users.blacklistReason
      )
      .orderBy(orderByClause)
      .limit(limitNumber + 1)
      .offset(offset);

    let countQuery = db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(users);

    // Add the same filters to count query
    if (searchTerm) {
      countQuery.where(
        or(
          ilike(users.username, `%${searchTerm}%`),
          ilike(users.email, `%${searchTerm}%`)
        )
      );
    }

    if (statusFilter) {
      countQuery.where(eq(users.status, statusFilter));
    }

    const [{ count: totalUsers }] = await countQuery;

    return res.status(200).json({
      users: result.splice(0, limitNumber),
      totalUsers: totalUsers,
      totalPages: Math.ceil(totalUsers / limitNumber),
      page: pageNumber,
      hasNextPage: result.length > limitNumber,
    });
  } catch (e) {
    console.error("Error fetching users:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

adminRouter.get("/vehicles", verifyToken, async (req, res) => {
  if (!req.userId || req.role !== "admin")
    return res.status(401).json({ error: "unauthorized access" });

  const { page, limit, sortBy, filter } = req.query;
  const pageNumber = parseInt(page as string) || 1;
  const limitNumber = parseInt(limit as string) || 10;
  const offset = (pageNumber - 1) * limitNumber;

  let filterOptions: any = {};
  let searchTerm = "";
  let statusFilter = null;
  let make = "";
  let model = "";

  let whereClause = [];

  if (filter) {
    try {
      filterOptions = JSON.parse(filter as string);
      searchTerm = filterOptions.search || "";
      make = filterOptions.make || "";
      model = filterOptions.model || "";
      statusFilter = filterOptions.status || null;
    } catch (error) {
      console.error("Error parsing filter:", error);
    }
  }

  // Determine sort order
  let orderByClause = sql`${vehicles.createdAt} DESC`;

  console.log(sortBy);
  console.log(searchTerm);
  console.log(statusFilter);

  if (sortBy === "oldest") {
    orderByClause = sql`${vehicles.createdAt} ASC`;
  } else if (sortBy === "reports") {
    orderByClause = sql`reports_count DESC`;
  } else if (sortBy === "views") {
    orderByClause = sql`${vehicles.views} DESC`;
  } else if (sortBy === "clicks") {
    orderByClause = sql`${vehicles.clicks} DESC`;
  } else if (sortBy === "leads") {
    orderByClause = sql`${vehicles.leads} DESC`;
  }

  // Base query
  let query = db
    .select({
      id: vehicles.id,
      type: vehicles.type,
      title: vehicles.title,
      description: vehicles.description,
      createdAt: vehicles.createdAt,
      status: vehicles.listingStatus,
      blacklistReason: vehicles.blacklistReason,
      listingType: vehicles.listingType,
      make: vehicles.make,
      model: vehicles.model,
      images: vehicles.images,
      color: vehicles.color,
      location: vehicles.location,
      latitude: vehicles.latitude,
      views: vehicles.views,
      leads: vehicles.leads,
      clicks: vehicles.clicks,
      reports_count:
        sql<number>`COALESCE(COUNT(DISTINCT ${lisitngReport.id}),0)`.as(
          "reports_count"
        ),
    })
    .from(vehicles)
    .leftJoin(lisitngReport, eq(vehicles.id, lisitngReport.reported_vehicle));

  if (searchTerm) {
    console.log("added search where clause");
    whereClause.push(
      or(
        ilike(vehicles.title, `%${searchTerm}%`),
        ilike(vehicles.description, `%${searchTerm}%`)
      )
    );
  }

  if (statusFilter) {
    whereClause.push(eq(vehicles.listingStatus, statusFilter));
  }

  // Add make/model filter if needed
  if (make) {
    whereClause.push(ilike(vehicles.make, `%${make}%`));
  }
  if (model) {
    whereClause.push(ilike(vehicles.model, `%${model}%`));
  }

  console.log(whereClause);

  if (whereClause.length > 0) {
    query.where(and(...whereClause));
  }

  const result = await query
    .groupBy(
      vehicles.id,
      vehicles.createdAt,
      vehicles.listingStatus,
      vehicles.blacklistReason,
      vehicles.make,
      vehicles.model,
      vehicles.images,
      vehicles.color,
      vehicles.location,
      vehicles.latitude,
      vehicles.views,
      vehicles.leads,
      vehicles.clicks
    )
    .orderBy(orderByClause)
    .limit(limitNumber + 1)
    .offset(offset);

  let countQuery = db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(vehicles);

  if (whereClause.length > 0) {
    countQuery.where(and(...whereClause));
  }

  const [{ count: totalVehicles }] = await countQuery;

  return res.status(200).json({
    vehicles: result.splice(0, limitNumber),
    totalVehicles: totalVehicles,
    totalPages: Math.ceil(totalVehicles / limitNumber),
    page: pageNumber,
    hasNextPage: result.length > limitNumber,
  });
});

adminRouter.get("/auctions", verifyToken, async (req, res) => {
  if (!req.userId || req.role !== "admin")
    return res.status(401).json({ error: "unauthorized access" });

  const { page, limit, sortBy, filter } = req.query;
  const pageNumber = parseInt(page as string) || 1;
  const limitNumber = parseInt(limit as string) || 10;
  const offset = (pageNumber - 1) * limitNumber;

  let filterOptions: any = {};
  let searchTerm = "";
  let statusFilter = null;

  let whereClause = [];

  if (filter) {
    try {
      filterOptions = JSON.parse(filter as string);
      searchTerm = filterOptions.search || "";
      statusFilter = filterOptions.status || null;
    } catch (error) {
      console.error("Error parsing filter:", error);
    }
  }

  console.log(searchTerm);
  console.log(statusFilter);

  // Determine sort order
  let orderByClause = sql`${auctions.createdAt} DESC`;

  console.log(sortBy);
  console.log(searchTerm);
  console.log(statusFilter);

  if (sortBy === "oldest") {
    orderByClause = sql`${auctions.createdAt} ASC`;
  } else if (sortBy === "reports") {
    orderByClause = sql`reports_count DESC`;
  } else if (sortBy === "bids") {
    orderByClause = sql`total_bids DESC`;
  } else if (sortBy === "views") {
    orderByClause = sql`${auctions.views} DESC`;
  } else if (sortBy === "clicks") {
    orderByClause = sql`${auctions.clicks} DESC`;
  } else if (sortBy === "leads") {
    orderByClause = sql`${auctions.leads} DESC`;
  }

  // Base query
  let query = db
    .select({
      id: auctions.id,
      title: auctions.title,
      description: auctions.description,
      vehicleId: auctions.itemId,
      startDate: auctions.startDate,
      endDate: auctions.endDate,
      status: auctions.status,
      blacklistReason: auctions.blacklistReason,
      currentBid: auctions.currentBid,
      views: auctions.views,
      leads: auctions.leads,
      clicks: auctions.clicks,
      total_bids: sql<number>`COUNT(DISTINCT ${bids.id})`.as("total_bids"),
      reports_count:
        sql<number>`COALESCE(COUNT(DISTINCT ${lisitngReport.id}),0)`.as(
          "reports_count"
        ),
      winner_email: auctionWinner.userEmail ?? null,
      winner_username: auctionWinner.username ?? null,
    })
    .from(auctions)
    .leftJoin(lisitngReport, eq(auctions.id, lisitngReport.reported_auction))
    .leftJoin(bids, eq(bids.auctionId, auctions.id))
    .leftJoin(auctionWinner, eq(auctionWinner.auctionId, auctions.id));

  if (searchTerm) {
    whereClause.push(
      or(
        ilike(auctions.title, `%${searchTerm}%`),
        ilike(auctions.description, `%${searchTerm}%`)
      )
    );
  }

  if (statusFilter && auctionStatus.includes(statusFilter)) {
    whereClause.push(eq(auctions.status, statusFilter));
  }

  if (whereClause.length > 0) {
    query.where(and(...whereClause));
  }

  const result = await query
    .groupBy(auctions.id, auctionWinner.userEmail, auctionWinner.username)
    .orderBy(orderByClause)
    .limit(limitNumber + 1)
    .offset(offset);

  let countQuery = db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(auctions);

  if (whereClause.length > 0) {
    countQuery.where(and(...whereClause));
  }

  const [{ count: totalAuctions }] = await countQuery;

  return res.status(200).json({
    auctions: result.splice(0, limitNumber),
    totalAuctions: totalAuctions,
    totalPages: Math.ceil(totalAuctions / limitNumber),
    page: pageNumber,
    hasNextPage: result.length > limitNumber,
  });
});

adminRouter.get("/reports/listings", verifyToken, async (req, res) => {
  if (!req.userId || req.role !== "admin")
    return res.status(401).json({ error: "unauthorized access" });

  const { page, limit, filter } = req.query;
  const pageNumber = parseInt(page as string) || 1;
  const limitNumber = parseInt(limit as string) || 5;

  console.log(filter);

  const offset = (pageNumber - 1) * limitNumber;

  // Define aliases for users table
  const reportedByUser = aliasedTable(users, "reportedByUser");
  const vehicleSeller = aliasedTable(users, "vehicleSeller");
  const auctionSeller = aliasedTable(users, "auctionSeller");
  const auctionVehicle = aliasedTable(vehicles, "auctionVehicle");

  let query = db
    .select({
      lisitngReport,
      reportedAuction: auctions,
      reportedVehicle: vehicles,
      reportedBy: reportedByUser,
      vehicleSeller: vehicleSeller,
      auctionSeller: auctionSeller,
      auctionVehicle: auctionVehicle,
    })
    .from(lisitngReport)
    .leftJoin(vehicles, eq(lisitngReport.reported_vehicle, vehicles.id))
    .leftJoin(auctions, eq(lisitngReport.reported_auction, auctions.id))
    .innerJoin(reportedByUser, eq(lisitngReport.reported_by, reportedByUser.id))
    .leftJoin(vehicleSeller, eq(vehicles.sellerId, vehicleSeller.id))
    .leftJoin(auctionSeller, eq(auctions.sellerId, auctionSeller.id))
    // Join auction.vehicleId to auctionVehicle if reported_auction is present
    .leftJoin(auctionVehicle, eq(auctions.itemId, auctionVehicle.id));

  // // Apply filters if provided
  if (filter === "vehicle") {
    query.where(isNotNull(lisitngReport.reported_vehicle));
  } else if (filter === "auction") {
    query.where(isNotNull(lisitngReport.reported_auction));
  } else if (filter === "resolved") {
    query.where(eq(lisitngReport.status, "resolved"));
  }

  // Execute query with sorting, limit and offset
  const result: any = await query
    .orderBy(sql`${lisitngReport.createdAt} DESC`)
    .limit(limitNumber + 1)
    .offset(offset);

  console.log(result);

  // Build count query with same filters
  let countQuery = db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(lisitngReport);

  // if (filter === 'vehicle') {
  //   countQuery = countQuery.where(notEq(lisitngReport.reported_vehicle, null));
  // } else if (filter === 'auction') {
  //   countQuery = countQuery.where(notEq(lisitngReport.reported_auction, null));
  // } else if (filter === 'resolved') {
  //   countQuery = countQuery.where(eq(lisitngReport.status, 'resolved'));
  // }

  const [{ count: totalReports }] = await countQuery;

  const reports = result.map((report: any) => ({
    reportId: report.lisitngReport.id,
    reportDescription: report.lisitngReport.description,
    reportedAt: report.lisitngReport.createdAt.toString(),
    status: report.lisitngReport.status || "pending",
    reportedBy: {
      id: report.reportedBy.id,
      username: report.reportedBy.username,
      email: report.reportedBy.email,
    },
    reportedVehicle: report.reportedVehicle
      ? {
          id: report.reportedVehicle.id,
          title: report.reportedVehicle.title,
          make: report.reportedVehicle.make,
          model: report.reportedVehicle.model,
          year: report.reportedVehicle.year,
          image_url: report.reportedVehicle.images[0],
          seller: report.vehicleSeller
            ? {
                id: report.vehicleSeller.id,
                username: report.vehicleSeller.username,
                email: report.vehicleSeller.email,
              }
            : null,
        }
      : null,
    reportedAuction: report.reportedAuction
      ? {
          id: report.reportedAuction.id,
          title: report.reportedAuction.title,
          startingPrice: report.reportedAuction.startingPrice,
          seller: report.auctionSeller
            ? {
                id: report.auctionSeller.id,
                username: report.auctionSeller.username,
                email: report.auctionSeller.email,
              }
            : null,
          vehicle: report.auctionVehicle
            ? {
                id: report.auctionVehicle.id,
                title: report.auctionVehicle.title,
                make: report.auctionVehicle.make,
                model: report.auctionVehicle.model,
                year: report.auctionVehicle.year,
                image_url: report.auctionVehicle.images[0],
              }
            : null,
        }
      : null,
  }));

  return res.status(200).json({
    reports: reports,
    totalReports: totalReports,
    totalPages: Math.ceil(totalReports / limitNumber),
    page: pageNumber,
    hasNextPage: reports.length > limitNumber,
  });
});

adminRouter.post("/raffle/create", verifyToken, async (req, res) => {
  if (!req.userId || !req.role || req.role !== "admin")
    return res.status(401).json({ error: "unauthorized access" });

  const data = req.body;
  console.log(data);

  // Validate raffle data
  const parseResult = raffleFormSchema.safeParse(data);

  if (!parseResult.success) {
    return res
      .status(400)
      .json({ error: "Invalid input", details: parseResult.error.errors });
  }

  let vehicleParse: any;
  if (!data.vehicleId) {
    vehicleParse = vehicleFormSchema.safeParse(data);
    if (!vehicleParse.success) {
      return res.status(400).json({
        error: "Invalid vehicle data",
        details: vehicleParse.error.errors,
      });
    }
  }
  const raffleData = {
    ...parseResult.data,
    ...vehicleParse.data,
    startDate: new Date(parseResult.data.startDate),
    endDate: new Date(parseResult.data.endDate),
    status: "upcoming",
  };
  const [savedRaffleDetails] = await db
    .insert(raffle)
    .values(raffleData)
    .returning();
  await raffleQueue.add(
    "startRaffle",
    {
      raffleId: savedRaffleDetails.id,
      endTime: savedRaffleDetails.endDate,
    },
    {
      delay: savedRaffleDetails.startDate.getTime() - Date.now(),
    }
  );
  return res.status(201).json({ message: "created" });
});

adminRouter.get("/raffle/get", verifyToken, async (req, res) => {
  if (!req.userId || !req.role || req.role !== "admin")
    return res.status(401).json({ error: "unauthorized access" });

  const { page, limit } = req.query;
  const pageNumber = parseInt(page as string) || 1;
  const limitNumber = parseInt(limit as string) || 5;

  const offset = (pageNumber - 1) * limitNumber;

  const raffleData = await db
    .select({
      raffle,
      raffleTicketSale,
    })
    .from(raffle)
    .leftJoin(raffleTicketSale, eq(raffleTicketSale.raffleId, raffle.id))
    .orderBy(sql`${raffle.createdAt} DESC`)
    .limit(limitNumber)
    .offset(offset);

  const responseData = raffleData.map((r: any) => {
    return {
      ...r.raffle,
      remainingTime: new Date(r.endDate).getTime() - Date.now(),
      ticket_sales: {
        ...r.raffleTicketSale,
      },
    };
  });

  return res.status(200).json(responseData);
});

adminRouter.get("/payment-history", verifyToken, async (req, res) => {
  if (!req.userId || req.role !== "admin")
    return res.status(401).json({ error: "unauthorized access" });

  const { page, limit, sortBy, filter } = req.query;
  const pageNumber = parseInt(page as string) || 1;
  const limitNumber = parseInt(limit as string) || 10;
  const offset = (pageNumber - 1) * limitNumber;

  let filterOptions: any = {};
  let searchTerm = "";
  let statusFilter = null;

  let whereClause = [];

  if (filter) {
    try {
      filterOptions = JSON.parse(filter as string);
      searchTerm = filterOptions.search || "";
      statusFilter = filterOptions.status || null;
      statusFilter = statusFilter.toUpperCase();
    } catch (error) {
      console.error("Error parsing filter:", error);
    }
  }

  // Determine sort order
  let orderByClause = sql`${paymentSession.createdAt} DESC`;

  console.log(sortBy);
  console.log(searchTerm);
  console.log(statusFilter);

  if (sortBy === "oldest") {
    orderByClause = sql`${paymentSession.createdAt} ASC`;
  }

  // Base query
  let query = db
    .select({
      id: paymentSession.id,
      status: paymentSession.status,
      amount: paymentSession.amount,
      currency: paymentSession.currency,
      paymentIntentId: paymentSession.paymentIntentId,
      username: users.username,
      email: users.email,
      userId: users.id,
      createdAt: paymentSession.createdAt,
    })
    .from(paymentSession)
    .leftJoin(users, eq(users.id, paymentSession.userId));

  if (searchTerm) {
    console.log("added search where clause");
    whereClause.push(
      or(ilike(paymentSession.paymentIntentId, `%${searchTerm}%`))
    );
  }

  if (statusFilter) {
    whereClause.push(eq(paymentSession.status, statusFilter));
  }

  console.log(whereClause);

  if (whereClause.length > 0) {
    query.where(and(...whereClause));
  }

  const result = await query
    .orderBy(orderByClause)
    .limit(limitNumber + 1)
    .offset(offset);

  let countQuery = db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(paymentSession);

  if (whereClause.length > 0) {
    countQuery.where(and(...whereClause));
  }

  const [{ count: totalPayments }] = await countQuery;

  return res.status(200).json({
    paymentHistory: result.splice(0, limitNumber),
    totalPayments: totalPayments,
    totalPages: Math.ceil(totalPayments / limitNumber),
    page: pageNumber,
    hasNextPage: result.length > limitNumber,
  });
});

adminRouter.get("/buyer-seller-chat", verifyToken, async (req, res) => {
  if (!req.userId || req.role !== "admin")
    return res.status(401).json({ error: "unauthorized access" });

  const { page, limit, sortBy, filter } = req.query;
  const pageNumber = parseInt(page as string) || 1;
  const limitNumber = parseInt(limit as string) || 10;
  const offset = (pageNumber - 1) * limitNumber;

  let filterOptions: any = {};
  let searchTerm = "";
  let statusFilter = null;

  let whereClause = [];

  if (filter) {
    try {
      filterOptions = JSON.parse(filter as string);
      searchTerm = filterOptions.search || "";
      statusFilter = filterOptions.status || null;
      statusFilter = statusFilter.toLowerCase();
    } catch (error) {
      console.error("Error parsing filter:", error);
    }
  }

  // Determine sort order
  let orderByClause = sql`${contactAttempts.createdAt} DESC`;

  console.log(sortBy);
  console.log(searchTerm);
  console.log(statusFilter);

  if (sortBy === "oldest") {
    orderByClause = sql`${contactAttempts.createdAt} ASC`;
  }

  // Base query

  const buyer = alias(users, "buyer");
  const seller = alias(users, "seller");

  const query = db
    .select({
      id: contactAttempts.id,
      message: contactAttempts.message,
      createdAt: contactAttempts.createdAt,
      status: contactAttempts.deliveryStatus,
      buyer: {
        id: buyer.id,
        username: buyer.username,
        email: buyer.email,
      },
      seller: {
        id: seller.id,
        username: seller.username,
        email: seller.email,
      },
    })
    .from(contactAttempts)
    .leftJoin(buyer, eq(buyer.id, contactAttempts.userId))
    .leftJoin(seller, eq(seller.id, contactAttempts.sellerId));

  if (searchTerm) {
    console.log("added search where clause");
    whereClause.push(or(ilike(contactAttempts.message, `%${searchTerm}%`)));
  }

  if (statusFilter) {
    whereClause.push(eq(contactAttempts.deliveryStatus, statusFilter));
  }

  console.log(whereClause);

  if (whereClause.length > 0) {
    query.where(and(...whereClause));
  }

  const result = await query
    .orderBy(orderByClause)
    .limit(limitNumber + 1)
    .offset(offset);

  let countQuery = db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(contactAttempts);

  if (whereClause.length > 0) {
    countQuery.where(and(...whereClause));
  }

  const [{ count: totalChats }] = await countQuery;

  return res.status(200).json({
    chatHistory: result.splice(0, limitNumber),
    totalChats: totalChats,
    totalPages: Math.ceil(totalChats / limitNumber),
    page: pageNumber,
    hasNextPage: result.length > limitNumber,
  });
});

adminRouter.get("/packages/all", verifyToken, async (req, res) => {
  if (!req.userId || !req.role || req.role !== "admin") {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  try {
    const { page, limit } = req.query;
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    // 3. Fetch packages from the database
    const allPackages = await db
      .select()
      .from(packages)
      .limit(limitNumber)
      .offset(offset);

    // 4. Fetch total count for pagination metadata
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(packages);
    const totalCount = totalCountResult[0].count;

    // 5. Send Response
    return res.status(200).json({
      packages: allPackages,
      total: totalCount,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalCount / limitNumber),
    });
  } catch (error) {
    console.error("Error fetching packages:", error);
    return res
      .status(500)
      .json({ error: "Internal server error while fetching packages." });
  }
});

adminRouter.post("/packages/add", verifyToken, async (req, res) => {
  if (!req.userId || !req.role || req.role !== "admin") {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  try {
    const {
      name,
      type,
      prices,
      duration_days,
      features,
      is_until_sold,
      is_rebookable,
      rebookable_days,
      youtubeShowcase,
      premiumPlacement,
    } = req.body;

    if (!name || !type || !prices || !duration_days || !features) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const newPackage = await db
      .insert(packages)
      .values({
        name,
        type,
        prices,
        duration_days,
        features,
        is_until_sold,
        youtubeShowcase,
        premiumPlacement,
      })
      .returning();

    return res
      .status(201)
      .json({ message: "Package added successfully.", data: newPackage[0] });
  } catch (error) {
    console.error("Error adding new package:", error);
    return res
      .status(500)
      .json({ error: "Internal server error while adding package." });
  }
});

adminRouter.put("/packages/update/:id", verifyToken, async (req, res) => {
  // 1. Authorization Check
  if (!req.userId || !req.role || req.role !== "admin") {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  try {
    const packageId = parseInt(req.params.id);
    if (isNaN(packageId)) {
      return res.status(400).json({ error: "Invalid package ID." });
    }

    const { ...updateData } = req.body;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No update data provided." });
    }

    const updatedPackage = await db
      .update(packages)
      .set(updateData)
      .where(eq(packages.id, packageId))
      .returning();

    if (updatedPackage.length === 0) {
      return res.status(404).json({ error: "Package not found." });
    }

    return res.status(200).json({
      message: "Package updated successfully.",
      data: updatedPackage[0],
    });
  } catch (error) {
    console.error(`Error updating package with ID ${req.params.id}:`, error);
    return res
      .status(500)
      .json({ error: "Internal server error while updating package." });
  }
});

adminRouter.put(
  "/packages/toggle-active/:id",
  verifyToken,
  async (req, res) => {
    // 1. Authorization Check
    if (!req.userId || !req.role || req.role !== "admin") {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    try {
      const packageId = parseInt(req.params.id);
      if (isNaN(packageId)) {
        return res.status(400).json({ error: "Invalid package ID." });
      }
      ``;
      const updatedPackage = await db
        .update(packages)
        .set({ is_active: not(packages.is_active) })
        .where(eq(packages.id, packageId))
        .returning({ id: packages.id, is_active: packages.is_active });

      if (updatedPackage.length === 0) {
        return res.status(404).json({ error: "Package not found." });
      }

      // 3. Send response
      return res.status(200).json({
        message: `Package status toggled to ${
          updatedPackage[0].is_active ? "Active" : "Inactive"
        }.`,
        data: updatedPackage[0],
      });
    } catch (error) {
      console.error(
        `Error toggling package status for ID ${req.params.id}:`,
        error
      );
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

export default adminRouter;
