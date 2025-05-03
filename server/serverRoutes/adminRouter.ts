import { Router } from "express";
import { hashPassword, comparePasswords } from "../utils/auth";
import { db } from "../db";
import {
  users,
  bids,
  vehicles,
  auctions,
  lisitngReport,
} from "../../shared/schema";
import { eq, or, sql, sum, aliasedTable,like , isNotNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
// import { notEq } from "drizzle-orm/pg-core";



import { verifyToken } from "../middleware/authMiddleware";

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
}

adminRouter.get(
  "/analytics/performance-metrics",
  verifyToken,
  async (req, res) => {
    if (!req.userId || req.role !== "admin")
      return res.status(401).json({ error: "unauthorized access" });

    //fetch the total clicks
    const vehicleTotals = await db
      .select({
        count: sql<number>`count(*)`,
        views: sum(vehicles.views).mapWith(Number),
        clicks: sum(vehicles.clicks).mapWith(Number),
      })
      .from(vehicles)
      .execute()
      .then((rows) => rows[0] || { views: 0, clicks: 0 });
    const auctionTotals = await db
      .select({
        count: sql<number>`count(*)`,
        views: sum(auctions.views).mapWith(Number),
        clicks: sum(auctions.clicks).mapWith(Number),
      })
      .from(auctions)
      .execute()
      .then((rows) => rows[0] || { views: 0, clicks: 0 });

    const [{ count: totalUsers }] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(users);

    const performanceMetrics = {
      totalUsers: totalUsers,
      totalVehicles: vehicleTotals.count,
      totalAuctions: auctionTotals.count,
      vehicleTotalViews: vehicleTotals.views,
      vehicleTotalClicks: vehicleTotals.clicks,
      auctionTotalViews: auctionTotals.views,
      auctionTotalClicks: auctionTotals.clicks,
      vehicleTotalLeads: 0,
      auctionTotalLeads: 0,
    };

    return res.status(200).json(performanceMetrics);
  }
);

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
    .innerJoin(vehicles, eq(auctions.vehicleId, vehicles.id))
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


adminRouter.put('/black-list/:userId', verifyToken, async (req, res) => {
  if (!req.userId || req.role !== "admin")  
    return res.status(401).json({ error: "unauthorized access" });
  let { userId } : any = req.params;
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


adminRouter.put('/un-black-list/:userId', verifyToken, async (req, res) => {
  if (!req.userId || req.role !== "admin")  
    return res.status(401).json({ error: "unauthorized access" });
  let { userId } : any = req.params;
  const { reason } = req.body;
  userId = parseInt(userId as string);
  
  if (!userId  || isNaN(userId)) {
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
});

adminRouter.get("/users", verifyToken, async (req, res) => {
  if (!req.userId || req.role !== "admin")
    return res.status(401).json({ error: "unauthorized access" });

  const { page, limit, sortBy, filter } = req.query;
  const pageNumber = parseInt(page as string) || 1;
  const limitNumber = parseInt(limit as string) || 10;
  const offset = (pageNumber - 1) * limitNumber;

  // Parse filter if provided
  let filterOptions:any = {};
  let searchTerm = "";
  let statusFilter = null;
  
  if (filter) {
    try {
      filterOptions = JSON.parse(filter as string);
      searchTerm = filterOptions.search || "";
      statusFilter = filterOptions.status || null;
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
      auctions_count: sql<number>`COUNT(DISTINCT ${auctions.id})`.as("auctions_count"),
      vehicles_count: sql<number>`COUNT(DISTINCT ${vehicles.id})`.as("vehicles_count"),
      bids_count: sql<number>`COUNT(DISTINCT ${bids.id})`.as("bids_count"),
      reports_count: sql<number>`COALESCE(COUNT(DISTINCT ${lr1.id}),0) + COALESCE(COUNT(DISTINCT ${lr2.id}),0)`.as("reports_count"),
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
        like(users.username, `%${searchTerm}%`),
        like(users.email, `%${searchTerm}%`)
      )
    );
  }
  
  // Add status filter if needed
  if (statusFilter) {
    query.where(eq(users.status, statusFilter));
  }

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
        like(users.username, `%${searchTerm}%`),
        like(users.email, `%${searchTerm}%`)
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
    .leftJoin(auctionVehicle, eq(auctions.vehicleId, auctionVehicle.id));

  // // Apply filters if provided
  if (filter === 'vehicle') {
    query.where(isNotNull(lisitngReport.reported_vehicle));
  } else if (filter === 'auction') {
     query.where(isNotNull(lisitngReport.reported_auction));
  } else if (filter === 'resolved') {
     query.where(eq(lisitngReport.status, 'resolved'));
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

// Export the router
export default adminRouter;
