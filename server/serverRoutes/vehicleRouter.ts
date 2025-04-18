import { Router } from "express";
import { db } from "../db";
import { Vehicle, vehicles } from "../../shared/schema";
import { eq, lte, or, gte, and, sql, inArray } from "drizzle-orm";
import RedisClientSingleton from "../utils/redis";
import axios from "axios";
import { vehicleUploadSchema } from "../../shared/zodSchema/vehicleSchema";
import { z } from "zod";
import { verifyToken } from "../middleware/authMiddleware";
import { parseCsvFile, extractVehicles } from "../utils/helper";
import multer from "multer";

// const redisClient = RedisClientSingleton.getInstance().getRedisClient();

const upload = multer();

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


vehicleRouter.get("/seller/listings", verifyToken, async (req, res) => {
  try {
    if(req.userId === undefined || req.role !== "seller"){
      return res.status(403).json({ error: "Unauthorized" });
    }
    console.log(req.query);
    const {
      brand,
      page = "1",
      limit = "10",
      sort
    } = req.query;

    const conditions = [];

    if (brand && !/all/gi.test(brand as string))
      conditions.push(eq(vehicles.make, String(brand)));

    console.log(conditions);
    conditions.push(eq(vehicles.sellerId, req.userId as number))

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
      .where(conditions.length ? and(...conditions) : undefined)
    
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


vehicleRouter.post("/upload-single", verifyToken, async (req, res) => {
  if (!req.userId || req.role !== "seller") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  try {
    console.log(req.body);
    const result = vehicleUploadSchema.safeParse(req.body);
    if (result.error) {
      return res.status(401).json({ error: result.error });
    }

    const data = {
      ...result.data,

      price: parseFloat(result.data.price),
      year: parseInt(result.data.year),
      mileage: parseFloat(result.data.mileage),
      category: "classified",
      sellerId: req.userId as number,
    };
    console.log(data);
    await db.insert(vehicles).values(data);
    res.status(200).json({ message: "Vehicle uploaded successfully" });
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
      const validVehicles = uploadedVehicles.filter(
        (v) =>{
          const result = vehicleUploadSchema.safeParse(v)
          console.log(result.error);
          return result.success
        }
      );

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
      const registrationNumbers = validVehicles.map(v => v.registration_num);
      
      // Check if any registration numbers already exist in the database
      const existingVehicles = await db
        .select({ registration_num: vehicles.registration_num })
        .from(vehicles)
        .where(inArray(vehicles.registration_num, registrationNumbers));
      
      if (existingVehicles.length > 0) {
        const duplicates = existingVehicles.map(v => v.registration_num).join(", ");
        return res.status(409).json({ 
          error: "Duplicate registration numbers found", 
          duplicates 
        });
      }
      await db.insert(vehicles).values(vehilcesWithOtherAttributes);
      return res.status(200).json({ message: "vehicle uploaded successfully" });
    } catch (e:any) {
      console.log(e);
      if(e.message.includes('Missing')){
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
            content: `You are a vehicle search assistant. Extract structured filter data from this string: ${searchParam}. Respond with a JSON object like:
            {
              "brand": "Audi",
              "color": "black",
              "power_hp": 200,
              "model":"Q8",
              "maxBudget": 8000000,
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
