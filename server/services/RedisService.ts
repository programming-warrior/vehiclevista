import RedisClientSingleton from "../utils/redis";


export class RedisService {
    static async addCache(key: string, value: any, expiryInSeconds: number = 3600): Promise<void> {
        try {
            const client = await RedisClientSingleton.getRedisClient();
            await client.set(key, JSON.stringify(value), {
                EX: expiryInSeconds
            });
        } catch (error) {
            console.error("Error setting cache in Redis:", error);
        }
    }
    static async getCache(key: string): Promise<{[key:string]: any} | null> {
        try {
            const client = await RedisClientSingleton.getRedisClient();
            const data = await client.get(key);
            if (data) {
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            console.error("Error getting cache from Redis:", error);
            return null;
        }
    }
}