import { NextFunction, Request, Response } from "express";
import RedisClientSingleton from "../utils/redis";
import { userSessionSchema } from "../utils/session";
import { ADMIN_SESSION_EXPIRY_SECONDS } from "../utils/session";
import z from "zod";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";

export async function verifyToken(req: Request, res: Response, next: NextFunction) {
 
  const sessionId =
    req.cookies.sessionId || req.headers.authorization?.split(" ")[1];


  if (!sessionId) {
    return res.status(403).json({ error: "Authorization header missing" });
  }
  const redisClient = await RedisClientSingleton.getRedisClient();

  const sessionData = await redisClient.get(`session:${sessionId}`);
  if (!sessionData) {
    res.clearCookie("sessionId");
    return res.status(403).json({ error: "Invalid session" });
  }
  const session: z.infer<typeof userSessionSchema> = JSON.parse(sessionData);

  // Check if user is blacklisted
  const [user] = await db
    .select({ status: users.status, blacklistReason: users.blacklistReason })
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1);

  if (!user) {
    res.clearCookie("sessionId");
    await redisClient.del(`session:${sessionId}`);
    return res.status(403).json({ error: "User not found" });
  }

  if (user.status === "blacklisted") {
    res.clearCookie("sessionId");
    await redisClient.del(`session:${sessionId}`);
    return res.status(403).json({ 
      error: "Account suspended", 
      message: "Your account has been suspended",
      reason: user.blacklistReason,
      isBlacklisted: true
    });
  }

  if(session.role=='admin'){
    await redisClient.expire(`session:${sessionId}`, ADMIN_SESSION_EXPIRY_SECONDS);
  }

  req.userId = session.id;
  req.role = session.role;
  req.card_verified = session.card_verified


  next();
}


export async function isAdmin(req: Request, res: Response, next: NextFunction) {
 
  const sessionId =
    req.cookies.sessionId || req.headers.authorization?.split(" ")[1];


  if (!sessionId) {
    return res.status(403).json({ error: "Authorization header missing" });
  }
  const redisClient = await RedisClientSingleton.getRedisClient();

  const sessionData = await redisClient.get(`session:${sessionId}`);
  if (!sessionData) {
    res.clearCookie("sessionId");
    return res.status(403).json({ error: "Invalid session" });
  }
  const session: z.infer<typeof userSessionSchema> = JSON.parse(sessionData);
  req.userId = session.id;
  req.role = session.role;
  req.card_verified = session.card_verified
  next();
}



export const verifyWebSocketToken = async (
  authHeader: string
) => {
  const sessionId = authHeader?.split(",")[1]?.trim();
  if (!sessionId) {
    console.error("No token found, connection closed.");
    return null;
  }
  try {
    const redisClient = await RedisClientSingleton.getRedisClient();

    const sessionData = await redisClient.get(`session:${sessionId}`);
    if (!sessionData) {
      return null;
    }
    const session: z.infer<typeof userSessionSchema> = JSON.parse(sessionData);
    return session;
  } catch (error: any) {
    console.error("Invalid token:", error.message);
    return null;
  }
};
