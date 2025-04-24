import { NextFunction, Request, Response } from "express";
import RedisClientSingleton from "../utils/redis";
import { userSessionSchema } from "server/utils/session";
import z from "zod"

export async function verifyToken(req: Request, res: Response, next: NextFunction) {
  console.log(req.cookies.sessionId);
  console.log(req.headers.authorization);
  const sessionId =
    req.cookies.sessionId || req.headers.authorization?.split(" ")[1];
    console.log(sessionId);


  if (!sessionId) {
    return res.status(403).json({ error: "Authorization header missing" });
  }
  const redisClient = await RedisClientSingleton.getRedisClient();

  const sessionData = await redisClient.get(`session:${sessionId}`);
  console.log(sessionData);
  if (!sessionData) {
    res.clearCookie("sessionId");
    return res.status(403).json({ error: "Invalid session" });
  }
  const session: z.infer<typeof userSessionSchema> = JSON.parse(sessionData);
  req.userId = session.id;
  req.role = session.role;
  next();
}

export const verifyWebSocketToken = async (
  authHeader: string
) => {
  console.log(authHeader)
  const sessionId = authHeader?.split(",")[1]?.trim();
  if (!sessionId) {
    console.error("No token found, connection closed.");
    return null;
  }
  try {
    const redisClient = await RedisClientSingleton.getRedisClient();

    const sessionData = await redisClient.get(`session:${sessionId}`);
    console.log(sessionData);
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
