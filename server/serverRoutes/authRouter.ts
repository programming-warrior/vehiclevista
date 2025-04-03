import { Router } from "express";
import { hashPassword, comparePasswords } from "../utils/auth";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { createUserSession, SESSION_EXPIRY_SECONDS } from "../utils/session";

const authRouter = Router();

// Registration route
authRouter.post("/register", (req, res) => {
  // Handle user registration logic here
  res.send("User registration endpoint");
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

    return res.status(200).json({ message: "login successfull" });
  } catch (e) {
    console.log(e)
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Export the router
export default authRouter;
