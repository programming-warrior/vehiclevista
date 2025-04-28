import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import dotenv from "dotenv";
import cors from "cors";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import RedisClientSingleton from "./utils/redis";
import cookieParser from "cookie-parser";
import { flushMetrics } from "./lib/cron-jobs/flush-metrics";
import cron from "node-cron";
dotenv.config();

import authRouter from "./serverRoutes/authRouter";
import vehicleRouter from "./serverRoutes/vehicleRouter";
import { verifyToken } from "./middleware/authMiddleware";
import { checkDomainOfScale } from "recharts/types/util/ChartUtils";
import auctionRouter from "./serverRoutes/auctionRouter";
import userRouter from "./serverRoutes/userRouter";
import adminRouter from "./serverRoutes/adminRouter";

const app = express();

// Extend the Request interface to include userId and role
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      role?: string;
      card_verified? : boolean;
    }
  }
}
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://vehiclevista-5v2w.vercel.app"
        : "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/auth", authRouter);
app.use("/api/vehicles", vehicleRouter);
app.use("/api/auction", auctionRouter)
app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)

// Add diagnostic endpoint
app.get("/ping", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});



const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY || '',
    secretAccessKey: process.env.AWS_SECRET_KEY || '',
  }
});


const BUCKET_NAME= process.env.BUCKET_NAME;

app.post('/api/presigned-url', verifyToken, async (req: Request, res: Response) => {
  try {
    if(!req.userId) return res.status(403).json({ message: "User ID not found" });
    const { files } = req.body;
    console.log(files);
    // Validate request body
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Files array is required in the request body' 
      });
    }

    // Generate presigned URLs for each file
    const presignedUrlPromises = files.map(async (file: { fileName: string, contentType: string }) => {
      const { fileName, contentType } = file;
      
      // Validate file information
      if (!fileName || !contentType) {
        throw new Error('fileName and contentType are required for each file');
      }

      // Create a unique key for the S3 object
      const key = `vehicles/${req.userId}/${Date.now()}-${fileName.split(' ').join('_')}`;
      
      // Create the command to put an object in S3
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      });

      // Generate a presigned URL for the command
      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // URL valid for 10 minutes 
      console.log(presignedUrl)
      return presignedUrl
    });

    // Wait for all presigned URL promises to resolve
    const presignedUrls = await Promise.all(presignedUrlPromises);

    // Return the URLs
    return res.status(200).json({
      success: true,
      urls: presignedUrls
    });
  } catch (error) {
    console.error('Error generating presigned URLs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate presigned URLs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api") || path === "/ping") {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      console.log(logLine);
    }
  });

  next();
});

(async () => {
  

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.log(`Error: ${status} - ${message}`);
    res.status(status).json({ message });
  });
  const redisClient = await RedisClientSingleton.getRedisClient();

  cron.schedule("*/5 * * * *", async () => {
    console.log("Flushing metrics...");
    try {
      await flushMetrics();
      console.log("Metrics flushed successfully!");
    } catch (error) {
      console.error("Error flushing metrics:", error);
    }
  });

  // ALWAYS serve the app on port 5000 and bind to all interfaces
  const port = 5000;
  app.listen(
    {
      port,
    },
    () => {
      console.log(`Server running at ${port}`);
    }
  );
})();
