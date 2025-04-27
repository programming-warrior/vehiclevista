import { Router } from "express";
import { hashPassword, comparePasswords } from "../utils/auth";
import { db } from "../db";
import { users, bids, vehicles, auctions } from "../../shared/schema";
import { eq, or, sql } from "drizzle-orm";
import { createUserSession, SESSION_EXPIRY_SECONDS } from "../utils/session";
import { userRegisterSchema } from "../../shared/zodSchema/userSchema";
import RedisClientSingleton from "../utils/redis";
import { verifyToken } from "../middleware/authMiddleware";
import { StringRouteParams } from "wouter";
import { userSessionSchema } from "../utils/session";

const userRouter = Router();

userRouter.get("/", verifyToken, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "No user found" });
  const userId = req.userId;
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (user.length === 0)
    return res.status(401).json({ error: "No user found" });
  const { ...userData } = user[0];

  //fetch total bids
  const [{ count: totalBids }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bids)
    .where(eq(bids.userId, userId))
    .limit(1);

  const dashboardData = {
    userId: userData.id,
    role: userData.role,
    username: userData.username,
    email: userData.email,
    card_verified: (userData.card as any).paymentMethodId ? true : false,
    totalBids: totalBids,
    memberSince: new Date(userData.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    }),
  };

  return res.status(200).json(dashboardData);
});

userRouter.get("/bids", verifyToken, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "No user found" });
  const userId = req.userId;

  //fetch total bids
  const result = await db
    .select({
      bids,
      auctions,
      vehicles,
    })
    .from(bids)
    .innerJoin(auctions, eq(auctions.id, bids.auctionId))
    .innerJoin(vehicles, eq(vehicles.id, auctions.vehicleId))
    .where(eq(bids.userId, userId))
    .orderBy(sql`${bids.createdAt} DESC`);

  const userbidHistory = result.map((row) => {
    const { bids, auctions, vehicles } = row;
    return {
      id: bids.id,
      auctionId: bids.auctionId,
      auctionTitle: auctions.title,
      auctionStatus: auctions.status,
      vehicleId: auctions.vehicleId,
      vehicleTitle: vehicles.title,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      vehicleYear: vehicles.year,
      bidAmount: bids.bidAmount,
      createdAt: bids.createdAt
        ? new Date(bids.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : null,
    };
  });
  return res.status(200).json(userbidHistory);
});

userRouter.patch("/change-password", verifyToken, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "No user found" });
  const userId = req.userId;
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    return res.status(400).json({ error: "invalid input" });
  const userRow = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (userRow.length === 0)
    return res.status(401).json({ error: "No user found" });

  const user = userRow[0];
  const match = await comparePasswords(oldPassword, user.password);
  if (!match) return res.status(401).json({ error: "Password not matched" });

  const hashedPassword: string = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, userId));

  return res.status(200).json({ message: "Password updated successfully" });
});

userRouter.patch("/card-info", verifyToken, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "No user found" });
  const userId = req.userId;
  const { paymentMethodId } = req.body;
  if (!paymentMethodId) return res.status(400).json({ error: "invalid input" });

  await db
    .update(users)
    .set({ card: { paymentMethodId } })
    .where(eq(users.id, userId));

  return res.status(200).json({ message: "Card updated successfully" });
});
// Registration route
userRouter.post("/register", async (req, res) => {
  const zodParseResult = userRegisterSchema.safeParse(req.body);
  if (!zodParseResult.success)
    return res.status(401).json({ error: "invalid input" });

  const user = zodParseResult.data;

  // Check if user already exists with the same email or username in a single query
  const existingUser = await db
    .select()
    .from(users)
    .where(or(eq(users.email, user.email), eq(users.username, user.username)))
    .limit(1);

  if (existingUser.length > 0) {
    // Determine which field caused the conflict
    if (existingUser[0].email === user.email) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    } else {
      return res.status(409).json({ error: "Username is already taken" });
    }
  }

  const hashedPassword: string = await hashPassword(user.password);
  // If no existing user, proceed with registration
  let [savedUser] = await db
    .insert(users)
    .values({ ...user, password: hashedPassword })
    .returning();

  //CREATE USER SESSIONS
  const sessionId = await createUserSession(savedUser);

  res.cookie("sessionId", sessionId, {
    maxAge: SESSION_EXPIRY_SECONDS * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });

  return res.status(200).json({
    role: savedUser.role,
    userId: savedUser.id,
    card_verified: (savedUser.card as any).paymentMethodId ? true : false,
    sessionId,
  });
});
// Login route
userRouter.post("/login", async (req, res) => {
  let { username, password } = req.body;
  username =
    typeof username == "string" && username.trim().length > 0
      ? username.trim()
      : "";
  password =
    typeof password == "string" && password.trim().length > 0
      ? password.trim()
      : "";

  if (!username || !password)
    return res.status(401).json({ error: "Username or Password not provided" });
  try {
    const [user] = await db
      .selectDistinct()
      .from(users)
      .where(eq(users.username, username));

    if (!user) return res.status(401).json({ error: "Wrong Credentials" });

    const match = await comparePasswords(password, user.password);
    if (!match) return res.status(401).json({ error: "Wrong Credentials" });

    //CREATE USER SESSIONS
    const sessionId = await createUserSession(user);

    res.cookie("sessionId", sessionId, {
      maxAge: SESSION_EXPIRY_SECONDS * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    });

    return res.status(200).json({
      role: user.role,
      userId: user.id,
      card_verified: (user.card as any).paymentMethodId ? true : false,
      sessionId,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//logout route

userRouter.delete("/logout", async (req, res) => {
  try {
    const sessionId =
      req.cookies.sessionId || req.headers.authorization?.split(" ")[1];
    if (!sessionId) return res.status(401).json({ error: "No session found" });
    const redisClient = await RedisClientSingleton.getRedisClient();

    await redisClient.del(`session:${sessionId}`);

    res.clearCookie("sessionId");
    return res.status(201).json({});
  } catch (error) {
    console.error("Session validation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Add this route to your existing userRouter
userRouter.get("/authenticate", async (req, res) => {
  try {
    // const sessionId = req.cookies.sessionId;
    const sessionId =
      req.headers.authorization?.split(" ")[1] || req.cookies.sessionId;
    if (!sessionId) {
      return res.status(401).json({ error: "No session found" });
    }

    const redisClient = await RedisClientSingleton.getRedisClient();

    const sessionData: string = await redisClient.get(`session:${sessionId}`);

    if (!sessionData) {
      res.clearCookie("sessionId");
      return res.status(401).json({ error: "Invalid session" });
    }

    const userData = JSON.parse(sessionData);

    return res.status(200).json({
      userId: userData.id,
      role: userData.role,
      card_verified: userData.card_verified,
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Export the router
export default userRouter;
