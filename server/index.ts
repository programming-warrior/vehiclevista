import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import dotenv from "dotenv";
import cors from "cors";
import RedisClientSingleton from "./utils/redis";
import cookieParser from "cookie-parser";
dotenv.config();

import authRouter from "./serverRoutes/authRouter";
import vehicleRouter from "./serverRoutes/vehicleRouter";

const app = express();
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

// Add diagnostic endpoint
app.get("/ping", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.log(`Error: ${status} - ${message}`);
    res.status(status).json({ message });
  });
  const redisClient = await RedisClientSingleton.getRedisClient();
  // ALWAYS serve the app on port 5000 and bind to all interfaces
  const port = 5000;
  server.listen(
    {
      port,
    },
    () => {
      console.log(`Server running at ${port}`);
    }
  );
})();
