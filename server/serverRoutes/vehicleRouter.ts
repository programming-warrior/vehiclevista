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
import { VehicleService } from "server/services/vehicleService";
import { RedisService } from "server/services/RedisService";
import { DBResult } from "drizzle-orm/sqlite-core";
import { REDIS_KEYS } from "server/utils/constants";

// const redisClient = RedisClientSingleton.getInstance().getRedisClient();

const upload = multer();

const vehicleRouter = Router();

vehicleRouter.get("/get-vehicle-count", async (req, res) => {
  try {

    const conditions = VehicleService.buildbuildSearchConditions({
      ...req.query
    })

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
    const {
      page = "1",
      limit = "10",
      latitude,
      longitude,
      sortBy
    } = req.query;


    const pageNum = parseInt(page as string, 10);
    let pageSize = parseInt(limit as string, 10);
    pageSize = Math.min(50, pageSize);
    const offset = (pageNum - 1) * pageSize;

    const conditions = VehicleService.buildbuildSearchConditions({
      ...req.query
    });
    let orderByClause = VehicleService.buildSortOption(sortBy as string | undefined, latitude as string | undefined, longitude as string | undefined)

    const [{ count:internalCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(vehicles)
    .where(conditions.length ? and(...conditions) : undefined);
    const dbResult = await db
      .select()
      .from(vehicles)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(offset);

    let externalApiCallResult:any = [];
    
    const result = [...dbResult];
      
    if (dbResult.length < pageSize ){
        const externalStartIdx = Math.max(0, (pageNum - 1) * pageSize - internalCount);
        const externalPage = Math.floor(externalStartIdx / 50 ) + 1;
        externalApiCallResult = await VehicleService.externalApiCall({ ...req.query, externalPage });
        console.log("externalStartIdx", externalStartIdx, "externalPage", externalPage, "externalApiCallResult.length", externalApiCallResult.length);
        const neededFromExternal = Math.max(0, pageSize - dbResult.length);
        const filteredExternalApiCallResult = externalApiCallResult.filter((v: any) => {
          //TODO
            return !result.find(r => r.registration_num === v.registration_num);
        });

        const slicedExternalApiCallResult = externalApiCallResult.slice(externalStartIdx, externalStartIdx + neededFromExternal);
        result.push(...slicedExternalApiCallResult);
    }


    const externalCountData= await RedisService.getCache(REDIS_KEYS.EXTERNAL_CLASSIFIED_LISTING_TOTAL_COUNT + `:${req.query.postalCode || ''}-${req.query.minBudget || ''}-${req.query.maxBudget || ''}`);
    console.log(externalCountData);
    const externalCount:number = (externalCountData?.count || 0) + pageSize ; // we can always fetch more from external api, that's why addding pageSize
    
    console.log("internalCount", internalCount, "externalCount", externalCount);
    let totalVechicles = Number(internalCount) + Number(externalCount);
    res.status(200).json({
      vehicles: result,
      totalVehicles: totalVechicles,
      totalPages: Math.ceil((totalVechicles) / pageSize),
      currentPage: pageNum,
      hasNextPage: pageNum * pageSize < (totalVechicles),
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
    if (!vehicleId)
      return res.status(400).json({ error: "Vehicle ID is required" });

    const data= await RedisService.getCache(`${REDIS_KEYS.VEHICLE_DETAILS}:${vehicleId}`);
    if(data){
      return res.status(200).json(data); 
    }
    //if the cache is not present then only internal data can be expected from db
    //vehicleId is expected to be a number
    if(isNaN(parseInt(vehicleId))){
      return res.status(404).json({ error: "Vehicle not found" });
    }
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, Number(vehicleId)))
      .limit(1);

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }
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
      redisClient.set(
        `vehicle:${vehicleId}:views:${ip}`,
        "1",
        { EX: 1 } // 1 second expiry
      ),
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
      redisClient.set(
        `vehicle:${vehicleId}:clicks:${ip}`,
        "1",
        { EX: 1 } // 1 second expiry
      ),
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
