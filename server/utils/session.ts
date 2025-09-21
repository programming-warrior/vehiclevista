import { z } from "zod";
import { userRoles, User } from "../../shared/schema";
import { randomBytes } from "crypto";
import RedisClientSingleton from "./redis";

export const userSessionSchema = z.object({
  id: z.number(),
  role: z.enum(userRoles),
  card_verified: z.boolean(),
});

export const SESSION_EXPIRY_SECONDS = 60 * 60 * 24; // 1 days
export const ADMIN_SESSION_EXPIRY_SECONDS = 60 * 15 // 15 mins
export const COOKIE_SESSION_KEY = "user-auth-session-cookieId";


type Cookies = {
  set: (
    key: string,
    value: string,
    options: {
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: "strict" | "lax";
      expires?: Number;
    }
  ) => void;
  get: (key: string) => { name: string; value: string } | undefined;
  delete: (key: string) => void;
};

export async function createUserSession(user: User, cookies?: Cookies) {
  try {
    const sessionId = randomBytes(512).toString("hex").normalize(); //sessionId needs to be very long
    const redisClient = await RedisClientSingleton.getRedisClient();
    // Serialize the session data
    const sessionData: z.infer<typeof userSessionSchema> = {
      role: user.role,
      id: user.id,
      card_verified: (user.card as any).paymentMethodId ? true : false
    } 
    let key = `session:${sessionId}`
    await redisClient.set(key, JSON.stringify(sessionData), {
      EX: user.role =='admin' ? ADMIN_SESSION_EXPIRY_SECONDS : SESSION_EXPIRY_SECONDS, // Use options object format
    });
    // setCookie(sessionId, cookies)
    return sessionId;
  } catch (e) {
    console.log("createUserSession error")
    throw e;
  }
}

function setCookie(sessionId: string, cookies: Pick<Cookies, "set">) {
  cookies.set(COOKIE_SESSION_KEY, sessionId, {
    secure: process.env.NODE_ENV === "production" ? true : false,
    httpOnly: process.env.NODE_ENV === "production" ? true : false,
    sameSite: "lax",
    expires: Date.now() + SESSION_EXPIRY_SECONDS * 1000,
  });
}
