import { WebSocketServer as WSServer } from "ws";
import type { WebSocket as WS } from "ws";
import { verifyWebSocketToken } from "../middleware/authMiddleware";
import { createClient } from "redis";
import dotenv from "dotenv"; // Fixed typo
import { randomUUID } from "crypto";
import { notificationQueue } from "../worker/queue";

interface WebSocketWithAlive extends WS {
  isAlive?: boolean;
}

dotenv.config();
const wss = new WSServer({ port: 5001 });

const redisSubscriberClient = createClient({
  url: `redis://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOSTNAME}:6379`,
  socket: {
    connectTimeout: 30000,
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});

async function initRedisClients() {
  try {
    await redisSubscriberClient.connect();
    console.log("Redis client connected successfully");
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
    setTimeout(initRedisClients, 5000);
  }
}
initRedisClients().catch(console.error);

const clients: { [id: string]: WebSocketWithAlive } = {};
const auctionClients: { [auctionId: string]: string[] } = {};
const raffleClients: { [raffleId: string]: string[] } = {};

// Track which channels we've already subscribed to
const subscribedChannels = new Set<string>();

// Global channel subscriptions (subscribe once, handle all clients)
async function initializeGlobalSubscriptions() {
  // Subscribe to global channels once
  await subscribeToBidPlace();
  await subscribeToRaffleTicketPurchase();
  await subscribeToBidPlaceError();
  await subscribeToReceiveNofication();
}

// Helper function to safely send messages to clients
const sendToClient = (userId: string, data: any) => {
  if (clients[userId]) {
    try {
      clients[userId].send(JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to send message to client ${userId}:`, error);
      // Remove dead client
      delete clients[userId];
    }
  }
};

// Helper function to subscribe to a channel only once
async function subscribeOnce(
  channel: string,
  handler: (message: string, channel: string) => void
) {
  if (!subscribedChannels.has(channel)) {
    try {
      await redisSubscriberClient.subscribe(channel, handler);
      subscribedChannels.add(channel);
      console.log(`Subscribed to channel: ${channel}`);
    } catch (error) {
      console.error(`Failed to subscribe to ${channel}:`, error);
    }
  }
}

wss.on("connection", async (ws: WebSocketWithAlive, req: any) => {
  const secWebSocketProtocolHeaderIndex = req.rawHeaders.findIndex(
    (val: string) => /sec-websocket-protocol/i.test(val)
  );

  let decodedValue: any = null;
  if (secWebSocketProtocolHeaderIndex > -1) {
    decodedValue = await verifyWebSocketToken(
      req.rawHeaders[secWebSocketProtocolHeaderIndex + 1]
    );
  }

  // Ensure unique client ID
  let ws_id: string;
  do {
    ws_id = decodedValue ? decodedValue.id.toString() : randomUUID();
  } while (clients[ws_id]);

  clients[ws_id] = ws;
  console.log("Client connected:", ws_id);

  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      console.log(data);

      if (data.type === "subscribe" && data.payload.auctionId) {
        const auctionId = data.payload.auctionId.toString();

        // Add client to auction group
        if (!auctionClients[auctionId]) {
          auctionClients[auctionId] = [];
        }

        // Only add if not already subscribed
        if (!auctionClients[auctionId].includes(ws_id)) {
          auctionClients[auctionId].push(ws_id);
        }

        // Subscribe to channel only once across all clients
        await subscribeToAuctionTimer(auctionId);

        ws.send(
          JSON.stringify({
            event: "AUCTION_TIMER_SUBSCRIBED",
            auctionId: data.payload.auctionId,
          })
        );
      } else if (data.type === "subscribe" && data.payload.raffleId) {
        const raffleId = data.payload.raffleId.toString();

        // Add client to raffle group
        if (!raffleClients[raffleId]) {
          raffleClients[raffleId] = [];
        }

        console.log(raffleClients[raffleId].length);

        // Only add if not already subscribed
        if (!raffleClients[raffleId].includes(ws_id)) {
          console.log("adding " + ws_id + "into raffleClients: " + raffleId);
          raffleClients[raffleId].push(ws_id);
        }

        // Subscribe to channel only once across all clients
        await subscribeToRaffleTimer(raffleId);

        ws.send(
          JSON.stringify({
            event: "RAFFLE_TIMER_SUBSCRIBED",
            raffleId: data.payload.raffleId,
          })
        );
      } else if (data.type === "unsubscribe" && data.payload.raffleId) {
        const raffleId = data.payload.raffleId.toString();
        raffleClients[raffleId] = auctionClients[raffleId].filter(
          (id) => id !== ws_id
        );
      } else if (data.type === "unsubscribe" && data.payload.auctionId) {
        const auctionId = data.payload.auctionId.toString();
        auctionClients[auctionId] = auctionClients[auctionId].filter(
          (id) => id !== ws_id
        );
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected:", ws_id);
    delete clients[ws_id];

    // Remove from auction groups
    Object.keys(auctionClients).forEach((auctionId) => {
      auctionClients[auctionId] = auctionClients[auctionId].filter(
        (id) => id !== ws_id
      );
    });

    // Remove from raffle groups
    Object.keys(raffleClients).forEach((raffleId) => {
      raffleClients[raffleId] = raffleClients[raffleId].filter(
        (id) => id !== ws_id
      );
    });
  });
});

// Global subscription functions (called once)
async function subscribeToBidPlace() {
  const channel = "BID_PLACED";
  await subscribeOnce(channel, async (message, channel) => {
    console.log(`Message received from ${channel}: ${message}`);
    const data = JSON.parse(message);
    const { userId } = data;
    await notificationQueue.add("BID_PLACED", {
      auctionId: data.auctionId,
      userId: data.userId,
      bidAmount: data.bidAmount,
    });
    const wsData = {
      event: "BID_PLACED",
      message: data,
    };
    sendToClient(userId, wsData);
  });
}

async function subscribeToReceiveNofication() {
  const channel = "RECEIVE_NOTIFICATION";
  await subscribeOnce(channel, (redis_msg, channel) => {
    console.log(`Message received from ${channel}: ${redis_msg}`);
    const data = JSON.parse(redis_msg);
    const { to } = data;
    const wsData = {
      event: "RECEIVE_NOTIFICATION",
      message: data,
    };
    sendToClient(to, wsData);
  });
}

async function subscribeToRaffleTicketPurchase() {
  const channel = "RAFFLE_TICKET_PURCHASED";
  await subscribeOnce(channel, (message, channel) => {
    console.log(`Message received from ${channel}: ${message}`);
    const data = JSON.parse(message);
    const { userId } = data;
    const wsData = {
      event: "RAFFLE_TICKET_PURCHASED",
      message: data,
    };
    sendToClient(userId, wsData);
  });
}

async function subscribeToBidPlaceError() {
  const channel = "BID_PLACED_ERROR";
  await subscribeOnce(channel, (message, channel) => {
    console.log(`Message received from ${channel}: ${message}`);
    const data = JSON.parse(message);
    const { payload } = data;
    const wsData = {
      event: "BID_PLACED_ERROR",
      message: data,
    };
    sendToClient(payload.userId, wsData);
  });
}

// Dynamic subscription functions (called per auction/raffle, but channel subscribed only once)
async function subscribeToAuctionTimer(auctionId: string) {
  const channel = `AUCTION_TIMER:${auctionId}`;
  await subscribeOnce(channel, (message, channel) => {
    const data = JSON.parse(message);
    if (data.auctionId != auctionId) return;

    console.log("Recived data from auction channel");
    console.log(data);
    const wsData = {
      event: "AUCTION_TIMER",
      message: data,
    };
    // Create a snapshot to avoid issues with concurrent modifications
    const clientsSnapshot = auctionClients[auctionId]
      ? [...auctionClients[auctionId]]
      : [];
    // Send to all clients subscribed to this auction
    clientsSnapshot.forEach((userId) => {
      sendToClient(userId, wsData);
    });
  });
}

async function subscribeToRaffleTimer(raffleId: string) {
  const channel = `RAFFLE_TIMER:${raffleId}`;
  await subscribeOnce(channel, (message, channel) => {
    console.log(`Message received from ${channel}: ${message}`);
    const data = JSON.parse(message);
    if (data.raffleId !== raffleId) return;

    const wsData = {
      event: "RAFFLE_TIMER",
      message: data,
    };
    const clientsSnapshot = raffleClients[raffleId]
      ? [...raffleClients[raffleId]]
      : [];
    console.log("raffle clients");
    console.log(clientsSnapshot);
    // Send to all clients subscribed to this raffle
    clientsSnapshot.forEach((userId) => {
      sendToClient(userId, wsData);
    });
  });
}

// Heartbeat mechanism
setInterval(() => {
  wss.clients.forEach((ws: WebSocketWithAlive) => {
    if (ws.isAlive === false) {
      console.log("Terminating dead client");
      ws.terminate();

      const disconnectedId = Object.keys(clients).find(
        (key) => clients[key] === ws
      );
      if (disconnectedId) {
        delete clients[disconnectedId];
        // Cleanup is handled in the 'close' event
      }
      return;
    }

    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// Initialize global subscriptions when server starts
initializeGlobalSubscriptions().catch(console.error);

redisSubscriberClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});
