import { Router } from "express";
import { db } from "../db";
import { vehicles } from "../../shared/schema";
import { eq, lte, or, gte, and, sql } from "drizzle-orm";
import RedisClientSingleton from "../utils/redis";
import axios from "axios";

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
