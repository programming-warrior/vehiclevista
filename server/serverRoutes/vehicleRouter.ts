import { Router } from "express";
import { db } from "../db";
import {
  Vehicle,
  vehicleConditionsEnum,
  vehicleDrafts,
  vehicleFavourites,
  vehicles,
} from "../../shared/schema";
import { eq, lte, or, gte, and, sql, inArray, ilike } from "drizzle-orm";
import RedisClientSingleton from "../utils/redis";
import axios from "axios";
import {
  vehicleFuelTypes,
  vehicleUploadSchema,
} from "../../shared/zodSchema/vehicleSchema";
import { z } from "zod";
import { verifyToken } from "../middleware/authMiddleware";
import { parseCsvFile, extractVehicles } from "../utils/helper";
import multer from "multer";
import { vehicleTypes, vehicleTypesEnum } from "../../shared/schema";
import { deleteImagesFromS3 } from "server/utils/s3";
import { cleanupQueue } from "../worker/queue";

// const redisClient = RedisClientSingleton.getInstance().getRedisClient();

const upload = multer();

const vehicleRouter = Router();

vehicleRouter.get("/get-vehicle-count", async (req, res) => {
  try {
    console.log(req.query);
    const {
      longitude,
      latitude,
      distance,
      make,
      model,
      type,
      transmissionType,
      color,
      bodyType,
      fuelType,
      minBudget,
      maxBudget,
    } = req.query;

    const conditions = [];

    if (make && String(make).toLowerCase() !== "all")
      conditions.push(eq(vehicles.make, String(make)));
    if (model && String(model).toLowerCase() !== "all")
      conditions.push(eq(vehicles.model, String(model)));
    if (
      type &&
      String(type).toLowerCase() !== "all" &&
      (type as (typeof vehicleTypesEnum.enumValues)[number])
    )
      conditions.push(
        eq(vehicles.type, type as (typeof vehicleTypesEnum.enumValues)[number])
      );
    if (transmissionType && String(transmissionType).toLowerCase() !== "all")
      conditions.push(eq(vehicles.transmission, String(transmissionType)));
    if (fuelType && String(fuelType).toLowerCase() !== "all")
      conditions.push(eq(vehicles.fuelType, String(fuelType)));
    if (bodyType && String(bodyType).toLowerCase() !== "all")
      conditions.push(eq(vehicles.bodyType, String(bodyType)));
    if (color && String(color).toLowerCase() !== "all")
      conditions.push(ilike(vehicles.color, String(color)));
    if (!isNaN(Number(minBudget)) && Number(minBudget) > 0)
      conditions.push(gte(vehicles.price, Number(minBudget)));
    if (!isNaN(Number(maxBudget)) && Number(maxBudget) > 0)
      conditions.push(lte(vehicles.price, Number(maxBudget)));

    //logic to fetch vehicles based on the postal code and distance
    if (
      latitude &&
      longitude &&
      !isNaN(parseFloat(latitude as string)) &&
      !isNaN(parseFloat(longitude as string))
    ) {
      const distanceString: string =
        distance || (distance as string).toLowerCase() !== "national"
          ? (distance as string).toLowerCase()
          : "";
      const match = distanceString.match(/^within\s+(\d+)\s+mile(s)?$/i);
      if (match) {
        const distanceValue = parseInt(match[1], 10);
        console.log("Extracted number:", distanceValue);
        const lat = parseFloat(latitude as string);
        const lon = parseFloat(longitude as string);
        //haversine formula
        //3969 ---> Earth's radius in miles
        conditions.push(sql`
      3959 * acos(
        cos(radians(${lat})) *
        cos(radians(${vehicles.latitude})) *
        cos(radians(${vehicles.longitude}) - radians(${lon})) +
        sin(radians(${lat})) *  
        sin(radians(${vehicles.latitude}))
      ) <= ${distanceValue}
    `);
      } else {
        console.log(distanceString);
        console.log("Invalid format: expected 'within <number> miles'");
      }
    }

    console.log(conditions);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(conditions.length ? and(...conditions) : undefined);

    res.status(200).json({
      count,
    });
  } catch (err: any) {
    console.error("Error fetching vehicles:", err);
    res
      .status(500)
      .json({ message: "Error fetching vehicle list", error: err.message });
  }
});

vehicleRouter.get("/", async (req, res) => {
  try {
    console.log(req.query);
    const {
      brand,
      model,
      type,
      transmissionType,
      color,
      bodyType,
      fuelType,
      minBudget,
      maxBudget,
      latitude,
      longitude,
      distance,
      vehicleCondition,
      fromYear,
      toYear,
      minMileage,
      maxMileage,
      page = "1",
      limit = "10",
      sortBy,
    } = req.query;

    const conditions = [];

    if (brand && String(brand).toLowerCase() !== "all")
      conditions.push(eq(vehicles.make, String(brand)));
    if (model && String(model).toLowerCase() !== "all")
      conditions.push(eq(vehicles.model, String(model)));
    if (
      type &&
      String(type).toLowerCase() !== "all" &&
      (type as (typeof vehicleTypesEnum.enumValues)[number])
    )
      conditions.push(
        eq(vehicles.type, type as (typeof vehicleTypesEnum.enumValues)[number])
      );
    if (transmissionType && String(transmissionType).toLowerCase() !== "all")
      conditions.push(eq(vehicles.transmission, String(transmissionType)));
    if (fuelType && String(fuelType).toLowerCase() !== "all")
      conditions.push(eq(vehicles.fuelType, String(fuelType)));
    if (bodyType && String(bodyType).toLowerCase() !== "all")
      conditions.push(eq(vehicles.bodyType, String(bodyType)));
    if (
      vehicleCondition &&
      vehicleConditionsEnum.enumValues.includes(vehicleCondition as any)
    ) {
      conditions.push(eq(vehicles.condition, vehicleCondition as any));
    }
    if (color && String(color).toLowerCase() !== "all")
      conditions.push(ilike(vehicles.color, String(color)));
    if (!isNaN(Number(minBudget)) && Number(minBudget) > 0)
      conditions.push(gte(vehicles.price, Number(minBudget)));
    if (!isNaN(Number(maxBudget)) && Number(maxBudget) > 0)
      conditions.push(lte(vehicles.price, Number(maxBudget)));
    if (!isNaN(Number(fromYear)))
      conditions.push(gte(vehicles.year, Number(fromYear)));
    if (!isNaN(Number(toYear)))
      conditions.push(lte(vehicles.year, Number(toYear)));
    if (!isNaN(Number(minMileage)))
      conditions.push(gte(vehicles.mileage, Number(minMileage)));
    if (!isNaN(Number(maxMileage)))
      conditions.push(lte(vehicles.mileage, Number(maxMileage)));

    //logic to fetch vehicles based on the postal code and distance
    if (
      latitude &&
      longitude &&
      !isNaN(parseFloat(latitude as string)) &&
      !isNaN(parseFloat(longitude as string))
    ) {
      const distanceString: string =
        distance || (distance as string).toLowerCase() !== "national"
          ? (distance as string).toLowerCase()
          : "";
      const match = distanceString.match(/^within\s+(\d+)\s+mile(s)?$/i);
      if (match) {
        const distanceValue = parseInt(match[1], 10);
        console.log("Extracted number:", distanceValue);
        const lat = parseFloat(latitude as string);
        const lon = parseFloat(longitude as string);
        //haversine formula
        //3969 ---> Earth's radius in miles
        conditions.push(sql`
      3959 * acos(
        cos(radians(${lat})) *
        cos(radians(${vehicles.latitude})) *
        cos(radians(${vehicles.longitude}) - radians(${lon})) +
        sin(radians(${lat})) *  
        sin(radians(${vehicles.latitude}))
      ) <= ${distanceValue}
    `);
      } else {
        console.log(distanceString);
        console.log("Invalid format: expected 'within <number> miles'");
      }
    }

    const pageNum = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * pageSize;

    console.log(conditions);

    let orderByClause = sql`${vehicles.createdAt} DESC`;

    if (sortBy === "oldest") {
      orderByClause = sql`${vehicles.createdAt} ASC`;
    } else if (sortBy === "price_low") {
      orderByClause = sql`${vehicles.price} ASC`;
    } else if (sortBy === "price_high") {
      orderByClause = sql`${vehicles.price} DESC`;
    } else if (sortBy === "mileage_low") {
      orderByClause = sql`${vehicles.mileage} ASC`;
    } else if (sortBy === "mileage_high") {
      orderByClause = sql`${vehicles.mileage} ASC`;
    } else if (sortBy === "nearest_first" && latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lon = parseFloat(longitude as string);
      orderByClause = sql`
      3959 * acos(
        cos(radians(${lat})) *
        cos(radians(${vehicles.latitude})) *
        cos(radians(${vehicles.longitude}) - radians(${lon})) +
        sin(radians(${lat})) *  
        sin(radians(${vehicles.latitude}))
      ) ASC
    `;
    }

    const result = await db
      .select()
      .from(vehicles)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(orderByClause)
      .limit(pageSize + 1)
      .offset(offset);

    console.log(result[0]?.model);
    console.log(model);
    console.log(model === result[0]?.model);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(conditions.length ? and(...conditions) : undefined);

    res.status(200).json({
      vehicles: result.splice(0, pageSize),
      totalVehicles: count,
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

vehicleRouter.get("/featured", async (req, res) => {
  try {
    console.log(req.query);
    const { name, page = "1", limit = "5" } = req.query;

    const conditions = [];
    console.log(name);

    if (name && !/all/gi.test(name as string)) {
      const typeValue = String(name).toLocaleLowerCase();
      console.log(typeValue);
      if (vehicleTypesEnum.enumValues.includes(typeValue as any)) {
        conditions.push(eq(vehicles.type, typeValue as any));
      }
    }

    console.log(conditions);

    const pageNum = parseInt(page as string, 10);
    const pageSize = Math.max(10, parseInt(limit as string, 10));
    const offset = (pageNum - 1) * pageSize;

    const result = await db
      .select()
      .from(vehicles)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(sql`${vehicles.views} DESC`)
      .limit(pageSize + 1)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(conditions.length ? and(...conditions) : undefined);

    res.status(200).json({
      featuredVehicles: result,
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

// const dvsaApiKey = process.env.DVSA_API_KEY;

// vehicleRouter.post("/dvsa", async (req, res) => {
//   try {
//     const { registration_num } = req.body;
//     if (!dvsaApiKey)
//       return res.status(500).json({ error: "dvsa key not found" });
//     if (
//       registration_num &&
//       typeof registration_num == "string" &&
//       registration_num.length > 0
//     ) {
//       try {
//         const dvsaResponse = await axios.get(
//           "https://sandbox.oneautoapi.com/autotrader/vehiclelookupfromvrm/v2?vehicle_registration_mark=" +
//             registration_num,
//           {
//             headers: {
//               "x-api": dvsaApiKey,
//               Accept: "application/json+v6",
//             },
//           }
//         );
//         return res.status(200).json(dvsaResponse.data);
//       } catch (e) {
//         console.log(e);
//         return res.status(500).json({ error: "dvsa api call failed" });
//       }
//     } else {
//       return res.status(400).json({ error: "invalid registration number" });
//     }
//   } catch (err: any) {
//     console.error("Error fetching vehicles:", err);
//     res
//       .status(500)
//       .json({ message: "Error fetching vehicle list", error: err.message });
//   }
// });

const oneAutoApiKey = process.env.ONE_AUTO_API_KEY;

vehicleRouter.post("/look-up", async (req, res) => {
  try {
    const { registration_num, current_mileage } = req.body;
    if (!oneAutoApiKey)
      return res.status(500).json({ error: "dvsa key not found" });
    if (
      registration_num &&
      typeof registration_num == "string" &&
      registration_num.length > 0 &&
      current_mileage
    ) {
      try {
        const apiResponse = await axios.get(
          "https://sandbox.oneautoapi.com/autotrader/vehiclelookupfromvrm/v2?vehicle_registration_mark=" +
            registration_num,
          {
            headers: {
              "x-api-key": oneAutoApiKey,
            },
          }
        );
        console.log(apiResponse.data);
        return res.status(200).json(apiResponse.data);
      } catch (e) {
        console.log(e);
        return res.status(500).json({ error: "oneauto api call failed" });
      }
    } else {
      return res.status(400).json({ error: "invalid registration number" });
    }
  } catch (err: any) {
    console.error("Error fetching vehicles:", err);
    res
      .status(500)
      .json({ message: "Error fetching vehicle list", error: err.message });
  }
});

vehicleRouter.get("/seller/draft/:draftId", verifyToken, async (req, res) => {
  try {
    if (req.userId === undefined) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    let draftId: any = req.params.draftId;
    draftId = draftId ? parseInt(draftId) : null;
    if (!draftId || isNaN(draftId)) {
      return res.status(400).json({ error: "invalid draftId" });
    }
    const [draftVehicle] = await db
      .select()
      .from(vehicleDrafts)
      .where(eq(vehicleDrafts.id, draftId));

    if (!draftVehicle) {
      return res.status(404).json({ error: "draft vehcile not found" });
    }

    res.status(200).json(draftVehicle);
  } catch (err: any) {
    console.error("Error fetching vehicles:", err);
    res
      .status(500)
      .json({ message: "Error fetching vehicle list", error: err.message });
  }
});

vehicleRouter.get("/seller/listings", verifyToken, async (req, res) => {
  try {
    if (req.userId === undefined || req.role !== "seller") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    console.log(req.query);
    const { brand, page = "1", limit = "10", sort } = req.query;

    const conditions = [];

    if (brand && !/all/gi.test(brand as string))
      conditions.push(eq(vehicles.make, String(brand)));

    console.log(conditions);
    conditions.push(eq(vehicles.sellerId, req.userId as number));

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

vehicleRouter.get("/:vehicleId", async (req, res) => {
  try {
    const { vehicleId } = req.params;
    if (!vehicleId || isNaN(parseInt(vehicleId)))
      return res.status(400).json({ error: "Vehicle ID is required" });
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, Number(vehicleId)))
      .limit(1);

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }
    console.log(vehicle);
    res.status(200).json(vehicle);
  } catch (err: any) {
    console.error("Error fetching vehicles:", err);
    res
      .status(500)
      .json({ message: "Error fetching vehicle list", error: err.message });
  }
});

vehicleRouter.post("/increase-views", async (req, res) => {
  try {
    const { vehicleId } = req.body;
    if (!vehicleId) {
      return res.status(400).json({ error: "Vehicle ID is required" });
    }
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    console.log("IP:", ip);
    console.log("User Agent:", userAgent);
    if (!ip || !userAgent) {
      return res.status(400).json({ error: "IP or User Agent is missing" });
    }
    const redisClient = await RedisClientSingleton.getRedisClient();
    const alreadyViewed = await redisClient.get(
      `vehicle:${vehicleId}:views:${ip}`
    );
    if (alreadyViewed) {
      return res.status(200).json({ message: "Already viewed recently" });
    }
    await Promise.all([
      redisClient.incr(`vehicle:${vehicleId}:views`),
      redisClient.set(`vehicle:${vehicleId}:views:${ip}`, "1", "EX", 1 * 60),
    ]);
    res.status(201).json({ message: "success" });
  } catch (err: any) {
    console.error("Error updating views count:", err);
    res.status(500).json({ message: "Error updating views count" });
  }
});

vehicleRouter.post("/update-favourite", verifyToken, async (req, res) => {
  try {
    if (!req.userId) return res.status(403).json({ error: "unauthorized" });
    let { vehicleId, toAdd } = req.body;
    vehicleId = parseInt(vehicleId, 10);
    if (typeof vehicleId !== "number" || isNaN(vehicleId)) {
      return res.status(400).json({ error: "Vehicle ID or toAdd is missing" });
    }
    await db.transaction(async (trx) => {
      const isFavourite = await trx.execute(
        sql`
      SELECT id 
      FROM ${vehicleFavourites}
      WHERE ${vehicleFavourites.vehicleId} = ${vehicleId}
      AND ${vehicleFavourites.userId} = ${req.userId}
      FOR UPDATE
    `
      );

      if (isFavourite.rows.length === 0) {
        await trx.insert(vehicleFavourites).values({
          vehicleId: vehicleId,
          userId: req.userId,
        });
      } else {
        await trx
          .delete(vehicleFavourites)
          .where(
            and(
              eq(vehicleFavourites.vehicleId, vehicleId),
              eq(vehicleFavourites.userId, req.userId as number)
            )
          );
      }
    });

    res.status(201).json({ message: "success" });
  } catch (err: any) {
    console.error("Error updating vehicle favourite:", err);
    res.status(500).json({ message: "Error updating vehicle favourite" });
  }
});



vehicleRouter.post("/increase-clicks", async (req, res) => {
  try {
    const { vehicleId } = req.body;
    if (!vehicleId) {
      return res.status(400).json({ error: "Vehicle ID is required" });
    }
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    console.log("IP:", ip);
    console.log("User Agent:", userAgent);
    if (!ip || !userAgent) {
      return res.status(400).json({ error: "IP or User Agent is missing" });
    }
    const redisClient = await RedisClientSingleton.getRedisClient();
    const alreadyClicked = await redisClient.get(
      `vehicle:${vehicleId}:clicks:${ip}`
    );
    if (alreadyClicked) {
      return res.status(200).json({ message: "Already clicked recently" });
    }
    await Promise.all([
      redisClient.incr(`vehicle:${vehicleId}:clicks`),
      redisClient.set(`vehicle:${vehicleId}:clicks:${ip}`, "1", "EX", 1 * 60),
    ]);
    res.status(201).json({ message: "success" });
  } catch (err: any) {
    console.error("Error updating clicks count:", err);
    res.status(500).json({ message: "Error updating clicks count" });
  }
});

vehicleRouter.post("/upload-single", verifyToken, async (req, res) => {
  if (!req.userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  try {
    console.log(req.body);
    const result = vehicleUploadSchema.safeParse(req.body);
    if (result.error) {
      if (req.body.images.length > 0) {
        cleanupQueue
          .add("delete-s3-images", { image_urls: [...req.body.images] })
          .then(() => console.log("added orphaned images to cleanup queue"))
          .catch((e) => {
            console.error(e);
          });
      }
      return res.status(401).json({ error: result.error });
    }

    const data = {
      ...result.data,
      make: result.data.make.toUpperCase(),
      model: result.data.make.toUpperCase(),
      color: result.data.color.toUpperCase(),
      price: parseFloat(result.data.price),
      year: parseInt(result.data.year),
      mileage: parseFloat(result.data.mileage),
      category: "classified",
      sellerId: req.userId as number,
    };
    console.log(data);
    const [row] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.registration_num, data.registration_num));
    if (row && row.id) {
      if (data.images.length > 0) {
        cleanupQueue
          .add("delete-s3-images", { image_urls: [...req.body.images] })
          .then(() => console.log("added orphaned images to cleanup queue"))
          .catch((e) => {
            console.error(e);
          });
      }
      return res.status(400).json({
        error: `Vehicle with registration number: ${data.registration_num} already exists`,
      });
    }
    const [savedVehicle] = await db
      .insert(vehicleDrafts)
      .values(data)
      .returning();
    res.status(200).json({
      message: "Vehicle uploaded successfully",
      draftId: savedVehicle.id,
    });
  } catch (e: any) {
    console.log(e.message);
    return res.status(500).json();
  }
});

vehicleRouter.post(
  "/upload-bulk",
  verifyToken,
  upload.single("csv"),
  async (req, res) => {
    if (!req.userId || req.role !== "seller") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    if (!req.file || !req.file.buffer || req.file.mimetype !== "text/csv") {
      return res.status(400).json({ error: "No CSV file uploaded" });
    }

    try {
      const parsedData: string[][] = await parseCsvFile(req.file.buffer);
      console.log(parsedData);
      if (parsedData.length > 1000) {
        return res.status(413).json({ error: "CSV exceeds row limit of 1000" });
      }
      const uploadedVehicles = extractVehicles(parsedData);
      console.log(uploadedVehicles);
      if (uploadedVehicles.length === 0) {
        return res
          .status(400)
          .json({ error: "No valid vehicle data found in CSV" });
      }
      const validVehicles = uploadedVehicles.filter((v) => {
        const result = vehicleUploadSchema.safeParse(v);
        console.log(result.error);
        return result.success;
      });

      if (validVehicles.length === 0) {
        return res
          .status(400)
          .json({ error: "No valid vehicles after validation" });
      }
      const vehilcesWithOtherAttributes = uploadedVehicles.map((v: any) => ({
        ...v,
        sellerId: req.userId,
        category: "classified",
      }));
      const registrationNumbers = validVehicles.map((v) => v.registration_num);

      // Check if any registration numbers already exist in the database
      const existingVehicles = await db
        .select({ registration_num: vehicles.registration_num })
        .from(vehicles)
        .where(inArray(vehicles.registration_num, registrationNumbers));

      if (existingVehicles.length > 0) {
        const duplicates = existingVehicles
          .map((v) => v.registration_num)
          .join(", ");
        return res.status(409).json({
          error: "Duplicate registration numbers found",
          duplicates,
        });
      }
      await db.insert(vehicles).values(vehilcesWithOtherAttributes);
      return res.status(200).json({ message: "vehicle uploaded successfully" });
    } catch (e: any) {
      console.log(e);
      if (e.message.includes("Missing")) {
        return res.status(400).json({ error: e.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

vehicleRouter.post("/advance-search", async (req, res) => {
  try {
    const { searchParam } = req.body;

    if (!searchParam) {
      return res.status(400).json({ message: "Search parameter is required" });
    }

    console.log(searchParam);

    const llmResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistral/ministral-8b",
        messages: [
          {
            role: "user",
            content: `You are a vehicle search assistant. Try Differentiate between type and bodyType, type means vehicle type like car, bike etc. bodytype means the architecture of the vehicle for example for the type car it could be sedan, suv etc.Extract structured filter data from this string: ${searchParam}. Respond with a JSON object like:
            {
              "brand": "Audi",
              "color": "black",
              "type": car | bike | van ,
              "transmissionType":"automatic" | "manual",
              "bodyType":"sedan" | "coupe" | "suv" | "muv",
              "model":"Q8",
              "maxBudget": 8000000,
              "minBudget":10000
            }
            Just return the JSON object without any additional text or explanation. If the information is not available, return null for that field. Do not include any other text in your response.
            Make sure to use camelCase for the keys. For example, use "maxBudget" instead of "Max Budget".`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(llmResponse);

    // Check for insufficient credits or token-related issues
    if (llmResponse.data?.error?.code == 402) {
      return res.status(402).json({
        message:
          "Insufficient credits or token limit exceeded. Please upgrade your account or reduce the request size.",
        error: llmResponse.data.error.message,
      });
    }

    const choice = llmResponse.data.choices?.[0];
    console.log(choice);
    if (!choice || !choice.message?.content) {
      return res.status(500).json({
        message: "LLM did not return a valid response.",
        error: "Empty or invalid content in LLM response.",
      });
    }

    let structuredSchema = choice.message.content.trim();
    console.log(structuredSchema);

    // Remove code block markers if present
    if (
      structuredSchema.startsWith("```") &&
      structuredSchema.endsWith("```")
    ) {
      structuredSchema = structuredSchema
        .replace(/^```[a-z]*\n/, "")
        .replace(/```$/, "");
    }

    let filterSchema;
    try {
      filterSchema = JSON.parse(structuredSchema);
    } catch (error: any) {
      console.log("Failed to parse LLM response");
      console.log(error.message);

      return res.status(500).json({ error: "Server Error" });
    }
    res.status(200).json({ filterSchema });
  } catch (err: any) {
    console.error("Error processing advance search:", err);
    res
      .status(500)
      .json({ message: "Error processing advance search", error: err.message });
  }
});

// Export the router
export default vehicleRouter;
