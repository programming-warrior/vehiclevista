import { Router } from "express";
import { hashPassword, comparePasswords } from "../utils/auth";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq, or } from "drizzle-orm";
import { createUserSession, SESSION_EXPIRY_SECONDS } from "../utils/session";
import { userRegisterSchema } from "../../shared/zodSchema/userSchema";
import RedisClientSingleton from "../utils/redis";
import { StringRouteParams } from "wouter";
import { userSessionSchema } from "../utils/session";

const authRouter = Router();

// Registration route
authRouter.post("/register", async (req, res) => {
  const zodParseResult = userRegisterSchema.safeParse(req.body);
  if (!zodParseResult.success)
    return res.status(401).json({ error: "invalid input" });

  const user = zodParseResult.data;
  console.log(user);

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
  console.log(hashedPassword);
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

  return res.status(200).json({ role: savedUser.role, userId: savedUser.id, card_verified: (savedUser.card as any).paymentMethodId ? true : false , sessionId });
});
// Login route
authRouter.post("/login", async (req, res) => {
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

    return res.status(200).json({ role: user.role, userId: user.id, card_verified: (user.card as any).paymentMethodId ? true : false , sessionId });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//logout route

authRouter.delete('/logout',async (req,res)=>{
  try{
    const  sessionId = req.cookies.sessionId || req.headers.authorization?.split(" ")[1];
    if(!sessionId) return res.status(401).json({error:"No session found"});
    const redisClient = await RedisClientSingleton.getRedisClient();

    await redisClient.del(`session:${sessionId}`);

    res.clearCookie("sessionId");
    return res.status(201).json({});
  }
  catch (error) {
    console.error("Session validation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
})

// Add this route to your existing authRouter
authRouter.get("/authenticate", async (req, res) => {
  try {
    console.log(req.cookies)
    // const sessionId = req.cookies.sessionId;
    const sessionId = req.headers.authorization?.split(" ")[1] || req.cookies.sessionId;
    console.log("sessionId" + sessionId);
    if (!sessionId) {
      return res.status(401).json({ error: "No session found" });
    }

    const redisClient = await RedisClientSingleton.getRedisClient();

    const sessionData:string = await redisClient.get(`session:${sessionId}`);
  
    if (!sessionData) {
      res.clearCookie("sessionId");
      return res.status(401).json({ error: "Invalid session" });
    }

    const userData = JSON.parse(sessionData);

    return res.status(200).json({
      userId: userData.id,
      role: userData.role,
      card_verified: userData.card_verified
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Export the router
export default authRouter;
