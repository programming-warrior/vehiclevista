import { Router } from "express";
import { hashPassword, comparePasswords } from "../utils/auth";
import { db } from "../db";
import { adminIpLogs, users } from "../../shared/schema";
import { eq, or } from "drizzle-orm";
import { ADMIN_SESSION_EXPIRY_SECONDS, createUserSession, SESSION_EXPIRY_SECONDS } from "../utils/session";
import { userRegisterSchema } from "../../shared/zodSchema/userSchema";
import RedisClientSingleton from "../utils/redis";
import axios from "axios";
import UAParser from 'my-ua-parser';


const authRouter = Router();

// Registration route
authRouter.post("/register", async (req, res) => {
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
  // Check redis verification marker
  const redisClient = await RedisClientSingleton.getRedisClient();
  const verifiedKey = `otp:verified:${user.email}`;
  const verifiedMarker = await redisClient.get(verifiedKey);
  const emailVerified = verifiedMarker ? true : false;

  let [savedUser] = await db
    .insert(users)
    .values({ ...user, password: hashedPassword, emailVerified })
    .returning();

  // remove the verification marker after consuming it
  if (verifiedMarker) await redisClient.del(verifiedKey);

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

authRouter.post("/google", async (req, res) => {
  const { token } = req.body;
  try {
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    );
    console.log(response.data);
    const { email, name, sub } = response.data;
    const existingUser = await db
      .select()
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, name)))
      .limit(1);

    let user = existingUser[0];
    if (!user) {
      //dummy password
      const password = await hashPassword("__google-auth-only__");

      const newUser = await db
        .insert(users)
        .values({
          username: name,
          password,
          email,
          authProvider: "google",
          role: "buyer",
        })
        .returning();

      user = newUser[0];
    }

    const sessionId = await createUserSession(user);
    res.cookie("sessionId", sessionId, {
      maxAge: SESSION_EXPIRY_SECONDS * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    });
    res.status(200).json({
      sessionId: sessionId,
      userId: user.id,
      role: user.role,
      card_verified: false,
    });
  } catch (err) {
    console.log(err);
    res.status(401).json({ error: "Invalid token" });
  }
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

    let loginLog: any = null;
    if (user.role == "admin") {
      //store the login logs
      console.log("Admin login detected");
    
      const parser = new UAParser(req.headers["user-agent"]);
      const ua = parser.getResult();
      const deviceBrowser = `${ua.browser.name ?? "Unknown"} ${
        ua.browser.version ?? ""
      }`;
      const deviceOS = `${ua.os.name ?? "Unknown"} ${ua.os.version ?? ""}`;

      loginLog = await db
        .insert(adminIpLogs)
        .values({
          adminId: user.id,
          ipAddress: (req.headers["x-forwarded-for"] ||
            req.socket.remoteAddress) as string,
          userAgentRaw: req.headers["user-agent"] || "Unknown",
          deviceBrowser: deviceBrowser,
          deviceOs: deviceOS,
          locationCity: "Unknown",
          locationCountry: "Unknown",
          sessionDuration: 0,
          createdAt: new Date(),
        })
        .returning();
    }

    const match = await comparePasswords(password, user.password);
    if (!match) return res.status(401).json({ error: "Wrong Credentials" });

    //CREATE USER SESSIONS
    const sessionId = await createUserSession(user);

    if (user.role == "admin" && loginLog && loginLog[0]?.id)
      await db
        .update(adminIpLogs)
        .set({
          status: "success",
        })
        .where(eq(adminIpLogs.id, loginLog[0].id));

    res.cookie("sessionId", sessionId, {
      maxAge: user.role=='admin'? ADMIN_SESSION_EXPIRY_SECONDS : SESSION_EXPIRY_SECONDS * 1000,
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

authRouter.delete("/logout", async (req, res) => {
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

// Add this route to your existing authRouter
authRouter.get("/authenticate", async (req, res) => {
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
export default authRouter;
