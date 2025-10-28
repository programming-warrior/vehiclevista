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

/**
 * Update user role in Redis session
 * @param userId - The user ID whose session needs to be updated
 * @param newRole - The new role to set
 */
export async function updateUserRoleInSession(userId: number, newRole: typeof userRoles[number]) {
  try {
    const redisClient = await RedisClientSingleton.getRedisClient();
    
    // Find all session keys (this is a pattern search)
    const sessionKeys = await redisClient.keys('session:*');
    
    // Iterate through sessions to find the one belonging to this user
    for (const key of sessionKeys) {
      const sessionData = await redisClient.get(key);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed.id === userId) {
          // Update the role in the session
          parsed.role = newRole;
          
          // Get the remaining TTL to preserve expiry
          const ttl = await redisClient.ttl(key);
          
          // Update the session with new role, preserving TTL
          if (ttl > 0) {
            await redisClient.set(key, JSON.stringify(parsed), {
              EX: ttl,
            });
          } else {
            // If TTL is -1 (no expiry) or -2 (key doesn't exist), set with default
            await redisClient.set(key, JSON.stringify(parsed), {
              EX: newRole === 'admin' ? ADMIN_SESSION_EXPIRY_SECONDS : SESSION_EXPIRY_SECONDS,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error updating user role in session:', error);
    throw error;
  }
}
