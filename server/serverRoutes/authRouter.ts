import { Router } from "express";
import { hashPassword, comparePasswords } from "../utils/auth";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq, or } from "drizzle-orm";
import { createUserSession, SESSION_EXPIRY_SECONDS } from "../utils/session";
import { userRegisterSchema } from "../../shared/zodSchema/userSchema";

const authRouter = Router();

// Registration route
authRouter.post("/register", async(req, res) => {
  const zodParseResult = userRegisterSchema.safeParse(req.body);
  if (!zodParseResult.success) return res.status(401).json({error: "invalid input"});
  
  const user = zodParseResult.data;
  
  // Check if user already exists with the same email or username in a single query
  const existingUser = await db.select()
    .from(users)
    .where(or(
      eq(users.email, user.email),
      eq(users.username, user.username)
    ))
    .limit(1);
  
  if (existingUser.length > 0) {
    // Determine which field caused the conflict
    if (existingUser[0].email === user.email) {
      return res.status(409).json({ error: "User with this email already exists" });
    } else {
      return res.status(409).json({ error: "Username is already taken" });
    }
  }
  
  const hashedPassword:string = await hashPassword(user.password);
  console.log(hashedPassword)
  // If no existing user, proceed with registration
  let [savedUser] = await db.insert(users).values({...user,password: hashedPassword}).returning()
  
  //CREATE USER SESSIONS
  const sessionId = await createUserSession(savedUser);

  console.log(sessionId);
  res.setHeader(
    "Set-Cookie",
    `sessionId=${sessionId}; Path=/; Max-Age=${SESSION_EXPIRY_SECONDS}; ${
      process.env.NODE_ENV === "production"
        ? "HttpOnly; Secure; SameSite=lax"
        : ""
    }`
  );

  return res.status(201).json({userId: savedUser.id, role: savedUser.role});
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

    console.log(user);
    //CREATE USER SESSIONS
    const sessionId = await createUserSession(user);

    console.log(sessionId);
    res.setHeader(
      "Set-Cookie",
      `sessionId=${sessionId}; Path=/; Max-Age=${SESSION_EXPIRY_SECONDS}; ${
        process.env.NODE_ENV === "production"
          ? "HttpOnly; Secure; SameSite=lax"
          : ""
      }`
    );

    return res.status(200).json({ role: user.role, userId: user.id});
  } catch (e) {
    console.log(e)
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Export the router
export default authRouter;
