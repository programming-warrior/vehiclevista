import { Router } from "express";
import { db } from "../db";
import { make, model } from "../../shared/schema";
import { eq, lte, or, gte, and, sql, inArray, ilike } from "drizzle-orm";
import RedisClientSingleton from "../utils/redis";
import axios from "axios";
import {
  vehicleFuelTypes,
  vehicleUploadSchema,
} from "../../shared/zodSchema/vehicleSchema";
import { z } from "zod";
import { verifyToken } from "../middleware/authMiddleware";
import multer from "multer";
import { vehicleTypes, vehicleTypesEnum } from "../../shared/schema";
import { deleteImagesFromS3 } from "server/utils/s3";
import { cleanupQueue } from "../worker/queue";
import { SiLamborghini } from "react-icons/si";

// const redisClient = RedisClientSingleton.getInstance().getRedisClient();
const brandRouter = Router();

brandRouter.get("/", async (req, res) => {
  try {
    const { page = "1", limit = "5" } = req.query;

    const pageNum = parseInt(page as string, 10);
    const pageSize = Math.max(10, parseInt(limit as string, 10));
    const offset = (pageNum - 1) * pageSize;

    const result = await db
      .select()
      .from(make)
      .leftJoin(model, eq(make.id, model.makeId))
      .groupBy(make.id, model.id)
      .limit(pageSize + 1)
      .offset(offset);

    console.log(result);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(make);

    res.status(200).json({
      brands: result,
      totalCount: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: pageNum,
      hasNextPage: result.length > pageSize,
    });
  } catch (err: any) {
    console.error("Error fetching brand:", err);
    res.status(500).json({ message: "Error fetching brand list" });
  }
});

brandRouter.get("/all", async (req, res) => {
  try {
    const result = await db
      .select()
      .from(make)
      .leftJoin(model, eq(make.id, model.makeId))
      .groupBy(make.id, model.id);

    res.status(200).json(result);
  } catch (err: any) {
    console.error("Error fetching brand:", err);
    res.status(500).json({ message: "Error fetching brand list" });
  }
});


// export async function seedValueToMakeTable() {
//    const MAKE_LOGO = {
//     Audi: "https://vehiclevista.s3.ap-south-1.amazonaws.com/brandLogo/audi.png",
//     BMW:"https://vehiclevista.s3.ap-south-1.amazonaws.com/brandLogo/bmw.png",
//     Lamborghini:"https://vehiclevista.s3.ap-south-1.amazonaws.com/brandLogo/lamborghini.png",
//     Buggati:"https://vehiclevista.s3.ap-south-1.amazonaws.com/brandLogo/buggati.png",
//     Volkswagon:"https://vehiclevista.s3.ap-south-1.amazonaws.com/brandLogo/volkswago.png",
//     Toyota:"https://vehiclevista.s3.ap-south-1.amazonaws.com/brandLogo/toyota.png",
//     Jaguar:"https://vehiclevista.s3.ap-south-1.amazonaws.com/brandLogo/jaguar.png",
//     Ferrari:"https://vehiclevista.s3.ap-south-1.amazonaws.com/brandLogo/ferrari.png"
//    }
//   const MAKE_MODEL_MAP: { [key: string]: string[] } = {
//     Audi: [
//       'A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'e-tron', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'SQ5', 'SQ7', 'SQ8', 'Allroad', 'Cabriolet', 'Coupe', 'Sportback', 'Avant', 'Quattro'
//     ],
//     BMW: [
//       '1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z3', 'Z4', 'Z8', 'M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'i3', 'i4', 'i8', 'iX', 'iX3', 'Gran Coupe', 'Touring', 'Active Tourer', 'Convertible', 'Roadster'
//     ],
//     Lamborghini: [
//       'Aventador', 'Huracan', 'Gallardo', 'Murcielago', 'Urus', 'Diablo', 'Countach', 'Reventon', 'Sian', 'Veneno', 'Centenario', 'Espada', 'Jalpa', 'Miura', 'Islero', 'Jarama', 'LM002', 'Silhouette', '400GT', '350GT', 'Estoque', 'SC18', 'Terzo Millennio'
//     ],
//     Buggati: [
//       'Chiron', 'Veyron', 'Divo', 'Centodieci', 'La Voiture Noire', 'EB110', 'Type 35', 'Type 41 Royale', 'Type 57', 'Bolide', 'Mistral', 'Super Sport', 'Grand Sport', 'Pur Sport', 'Targa', 'Touring', 'Atlantic', 'Galibier'
//     ],
//     Volkswagon: [
//       'Golf', 'Polo', 'Passat', 'Jetta', 'Tiguan', 'Touareg', 'Arteon', 'T-Roc', 'T-Cross', 'ID.3', 'ID.4', 'ID.5', 'ID. Buzz', 'Beetle', 'Scirocco', 'Sharan', 'Touran', 'Caddy', 'Amarok', 'Transporter', 'Multivan', 'Up!', 'Fox', 'Lupo', 'Corrado', 'Bora', 'Eos', 'Phaeton', 'CC', 'Vento', 'Atlas', 'Taos', 'Teramont'
//     ],
//     Toyota: [
//       'Corolla', 'Camry', 'Yaris', 'RAV4', 'Highlander', 'Land Cruiser', 'Hilux', 'Fortuner', 'Innova', 'Prius', 'Supra', 'C-HR', 'Avanza', 'Vios', 'Etios', 'Sienna', 'Tacoma', 'Tundra', '4Runner', 'Sequoia', 'FJ Cruiser', 'Auris', 'Celica', 'MR2', 'Previa', 'Proace', 'Verso', 'Aygo', 'Crown', 'Century', 'Alphard', 'Vellfire', 'GR86', 'bZ4X'
//     ],
//     Jaguar: [
//       'XE', 'XF', 'XJ', 'F-Pace', 'E-Pace', 'I-Pace', 'F-Type', 'S-Type', 'X-Type', 'XK', 'XKR', 'XJS', 'Mark 2', 'Mark X', 'D-Type', 'C-Type', 'E-Type', 'XJ220', 'XJR', 'XJ6', 'XJ8', 'XJ12', 'Sovereign', 'Daimler', 'XFR', 'XKR-S', 'XFL', 'XEL', 'XJ13'
//     ],
//     Ferrari: [
//       '488', '812', 'F8', 'SF90', 'Roma', 'Portofino', 'GTC4Lusso', 'F12', 'LaFerrari', '458', 'California', '360', '430', 'Enzo', '599', '612', '550', '575M', '456', '348', '328', '308', 'Mondial', 'Testarossa', '512', 'F40', 'F50', 'Dino', 'Superamerica', 'Maranello', 'Scuderia', 'Spider', 'Pista', 'Challenge Stradale', 'GTB', 'GTS', 'Aperta', 'TDF', 'Purosangue'
//     ]
//   };

//   for (const makeName of Object.keys(MAKE_MODEL_MAP)) {
//     // Insert make if not exists
//     let [makeRow] = await db
//       .select()
//       .from(make)
//       .where(eq(make.name, makeName));

//     if (!makeRow) {
//       // Insert make
//       const inserted = await db
//         .insert(make)
//         .values({ name: makeName, logoUrl: MAKE_LOGO[makeName as keyof typeof MAKE_LOGO] })
//         .returning();
//       makeRow = inserted[0];
//     }

//     // Insert models for this make
//     for (const modelName of MAKE_MODEL_MAP[makeName]) {
//       const [modelRow] = await db
//         .select()
//         .from(model)
//         .where(eq(model.name, modelName));
//       if (!modelRow) {
//         await db.insert(model).values({ name: modelName, makeId: makeRow.id });
//       }
//     }
//   }
//   console.log("Seeding complete!");
// }

export default brandRouter;
