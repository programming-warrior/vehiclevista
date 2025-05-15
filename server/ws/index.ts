import { WebSocketServer as WSServer } from "ws";
import type { WebSocket } from "ws";
import { verifyWebSocketToken } from "../middleware/authMiddleware";
import { createClient } from "redis";
import dotevn from "dotenv";
dotevn.config();
const wss = new WSServer({ port: 5001 });

const redisSubscriberClient = createClient({
  url: `redis://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOSTNAME}:6379`,
  socket: {
    // tls: true,
    // rejectUnauthorized: false,
    connectTimeout: 30000,
    // noDelay: true,
    // keepAlive: 5000,
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});
async function initRedisClients() {
  try {
    await redisSubscriberClient.connect();
    console.log("Redis client connected successfully");
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
    setTimeout(initRedisClients, 5000); // Retry connection
  }
}
initRedisClients().catch(console.error);

//global websocket clients
const clients: { [id: string]: WebSocket } = {};
const auctionClients: { [id: string]: string[] } = {};
const raffleClients: { [id: string]: string[] } = {}


console.log("redis client connected");
console.log("websocket server running on port 5001");

wss.on("connection", async (ws, req: any) => {
  const secWebSocketProtocolHeaderIndex = req.rawHeaders.findIndex(
    (val: string) => /sec-websocket-protocol/i.test(val)
  );
  if (secWebSocketProtocolHeaderIndex === -1) {
    ws.close();
    return;
  }
  const decodedValue = await verifyWebSocketToken(
    req.rawHeaders[secWebSocketProtocolHeaderIndex + 1]
  );

  if (!decodedValue) {
    ws.close();
    return;
  }

  console.log("connected to websocket", decodedValue);
  clients[decodedValue.id.toString()] = ws;

  await subscribeToBidPlace();
  await subscribeToRaffleTicketPurchase();
  await subscribeToBidPlaceError()

  ws.on("message", async (msg) => {
    const data = JSON.parse(msg.toString());
    console.log(data);
    if (data.type === "subscribe" && data.payload.auctionId) {
      if (!auctionClients[data.payload.auctionId]) {
        auctionClients[data.payload.auctionId] = [];
      }
      auctionClients[data.payload.auctionId].push(decodedValue.id.toString());
      await subscribeToAuctionTimer(data.payload.auctionId.toString());
      ws.send(
        JSON.stringify({
          event: "AUCTION_TIMER_SUBSCRIBED",
          auctionId: data.payload.auctionId,
        })
      );
      // clients[decodedValue.id.toString()]
      //   auctionClients.get(data.auctionId).add(ws);
    }
    else if (data.type === "subscribe" && data.payload.raffleId) {
      
      if (!raffleClients[data.payload.raffleId]) {
        raffleClients[data.payload.raffleId] = [];
      }
      raffleClients[data.payload.raffleId].push(decodedValue.id.toString());
      await subscribeToRaffleTimer(data.payload.raffleId.toString());
      ws.send(
        JSON.stringify({
          event: "RAFFLE_TIMER_SUBSCRIBED",
          raffleId: data.payload.raffleId,
        })
      );
      // clients[decodedValue.id.toString()]
      //   auctionClients.get(data.auctionId).add(ws);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected:", decodedValue.id);
  });
});

async function subscribeToBidPlace() {
  try {
    await redisSubscriberClient.subscribe("BID_PLACED", (message, channel) => {
      console.log(`Message received from ${channel}: ${message}`);
      const data = JSON.parse(message);
      const { userId, bidId, bidAmount, auctionId } = data;
      const wsData = {
        event: "BID_PLACED",
        message: data,
      };
      clients[userId].send(JSON.stringify(wsData));
    });
    console.log("Subscribed to BID_PLACED");
  } catch (error: any) {
    console.error("Failed to subscribe to Redis channel:", error.message);
  }
}

async function subscribeToRaffleTicketPurchase() {
  try {
    await redisSubscriberClient.subscribe("RAFFLE_TICKET_PURCHASED", (message, channel) => {
      console.log(`Message received from ${channel}: ${message}`);
      const data = JSON.parse(message);
      const { userId, bidId, ticketQuantity, raffleId } = data;
      const wsData = {
        event: "RAFFLE_TICKET_PURCHASED",
        message: data,
      };
      clients[userId].send(JSON.stringify(wsData));
    });
    console.log("Subscribed to RAFFLE_TICKET_PURCHASED");
  } catch (error: any) {
    console.error("Failed to subscribe to Redis channel:", error.message);
  }
}

async function subscribeToBidPlaceError() {
  try {
    await redisSubscriberClient.subscribe("BID_PLACED_ERROR", (message, channel) => {
      console.log(`Message received from ${channel}: ${message}`);
      const data = JSON.parse(message);
      const { error, payload } = data;
      const wsData = {
        event: "BID_PLACED_ERROR",
        message: {
          error, 
          payload
        },
      };
      clients[payload.userId].send(JSON.stringify(wsData));
    });
    console.log("Subscribed to BID_PLACED");
  } catch (error: any) {
    console.error("Failed to subscribe to Redis channel:", error.message);
  }
}


async function subscribeToRaffleTimer(raffleId: string) {
  try {
    await redisSubscriberClient.subscribe(
      "RAFFLE_TIMER:" + raffleId,
      (message, channel) => {
        console.log(`Message received from ${channel}: ${message}`);
        const data = JSON.parse(message);
        console.log(data.raffleId===raffleId)
        if (data.raffleId != raffleId) return;

        const wsData = {
          event: "RAFFLE_TIMER",
          message: data,
        };
        console.log(raffleClients);

        raffleClients[data.raffleId]?.forEach((userId) => {
          if (clients[userId]) {
            console.log("sending data to the client " + userId);
            clients[userId].send(JSON.stringify(wsData));
          } else {
            console.warn(`No WebSocket client found for username: ${userId}`);
          }
        });
      }
    );
    console.log("Subscribed to Raffle Timer channel:", raffleId);
  } catch (error: any) {
    console.error("Failed to subscribe to Redis channel:", error.message);
  }
}

async function subscribeToAuctionTimer(auctionId: string) {
  try {
    await redisSubscriberClient.subscribe(
      "AUCTION_TIMER:" + auctionId,
      (message, channel) => {
        // console.log(`Message received from ${channel}: ${message}`);
        const data = JSON.parse(message);
        if (data.auctionId !== auctionId) return;

        const wsData = {
          event: "AUCTION_TIMER",
          message: data,
        };

        auctionClients[data.auctionId]?.forEach((userId) => {
          if (clients[userId]) {
            // console.log("sending data to the client " + userId);
            clients[userId].send(JSON.stringify(wsData));
          } else {
            console.warn(`No WebSocket client found for username: ${userId}`);
          }
        });
      }
    );
    console.log("Subscribed to Auction Timer channel:", auctionId);
  } catch (error: any) {
    console.error("Failed to subscribe to Redis channel:", error.message);
  }
}


redisSubscriberClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});