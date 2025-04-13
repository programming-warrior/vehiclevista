import { createClient, RedisClientType } from "redis";


class RedisClientSingleton {
  // Static value for the redisClient instance
  static redisClient:any = null;

  // Private constructor to prevent instantiation
  constructor() {
    if (RedisClientSingleton.redisClient) {
      return RedisClientSingleton.redisClient ;
    }
   
    RedisClientSingleton.redisClient = createClient({
      url: `redis://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOSTNAME}:6379`,
      socket: {
        // tls: true,
        // rejectUnauthorized: false,
        // connectTimeout: 30000,
        // noDelay: true,
        // keepAlive: 5000,
        // reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
      },
    });

    // Set up event listeners
    this.setupRedisListeners();

    return RedisClientSingleton.redisClient;
  }

  // Method to connect and return the Redis client
  static async getRedisClient() {
    if (!RedisClientSingleton.redisClient) {
      new RedisClientSingleton(); 
    }

    if (!RedisClientSingleton.redisClient.isOpen) {
      await RedisClientSingleton.redisClient.connect();
    }

    return RedisClientSingleton.redisClient;
  }


  // Private method to set up Redis event listeners
  setupRedisListeners() {
    RedisClientSingleton.redisClient.on('debug', (message:any) => console.log('Redis Debug:', message));
    RedisClientSingleton.redisClient.on('error', (err:any) => console.error('Redis Client Error:', err));
    RedisClientSingleton.redisClient.on('connect', () => console.log('Redis Client Connected'));
    RedisClientSingleton.redisClient.on('ready', () => console.log('Redis Client Ready'));
    RedisClientSingleton.redisClient.on('reconnecting', () => console.log('Redis Client Reconnecting'));
  }
}

export default RedisClientSingleton;
