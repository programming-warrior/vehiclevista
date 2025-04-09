import { Router } from "express";
import { db } from "../db";
import { vehicles } from "../../shared/schema";
import { eq, lte, or, gte, and, sql } from "drizzle-orm";
import RedisClientSingleton from "../utils/redis";

const vehicleRouter = Router();

vehicleRouter.get("/get", async (req, res) => {
  try {
    console.log(req.query);
    const {
      brand,
      model,
      variant,
      minBudget,
      maxBudget,
      page = "1",
      limit = "10",
    } = req.query;

    const conditions = [];

    if (brand && !/all/gi.test(brand as string))
      conditions.push(eq(vehicles.make, String(brand)));
    if (model && !/all/gi.test(model as string))
      conditions.push(eq(vehicles.model, String(model)));
    if (minBudget) conditions.push(gte(vehicles.price, Number(minBudget)));
    if (maxBudget) conditions.push(lte(vehicles.price, Number(maxBudget)));

    console.log(conditions);

    const pageNum = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * pageSize;

    const result = await db
      .select()
      .from(vehicles)
      .where(conditions.length ? and(...conditions) : undefined)
      .limit(pageSize + 1)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(conditions.length ? and(...conditions) : undefined);

    res.status(200).json({
      vehicles: result,
      totalCount: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: pageNum,
      hasNextPage: result.length > pageSize,
    });
  } catch (err: any) {
    console.error("Error fetching vehicles:", err);
    res
      .status(500)
      .json({ message: "Error fetching vehicle list", error: err.message });
  }
});

// Export the router
export default vehicleRouter;
