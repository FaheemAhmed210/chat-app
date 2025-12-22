const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");
const { SERVER_ENVIRONMENTS } = require("../helpers/constants");
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const { heartbeatHandler } = require("./handlers/ws-heartbeat.handler");
const { handleUserOffline } = require("./handlers/userOffline.handler");
const configs = require("../configs");
let io;
const roomHandler = require("./handlers/room.handler");
const messageHandler = require("./handlers/message.handler");
const {
  disconnectionHandler,
  connectionHandler,
} = require("./handlers/ws-connection.handler");

const { verifySocketToken } = require("../src/common/auth/jwt");

module.exports.initServer = async (server) => {
  try {
    io = new Server(server, {
      cors: {
        origin: "*",
      },
      transports: ["websocket"], // only allow websocket transport
      pingInterval: 25000, // ping every 25s
      pingTimeout: 60000, // wait 60s before disconnect
    });

    if (process.env.NODE_ENV !== SERVER_ENVIRONMENTS.PRODUCTION) {
      instrument(io, {
        auth: false,
      });
    }

    console.log("Initializing WebSocket server...");

    const pubClient = createClient({
      url: configs.redis.host,
    });
    const subClient = pubClient.duplicate();
    const keySub = pubClient.duplicate();

    io.use(verifySocketToken);

    io.adapter(createAdapter(pubClient, subClient));
    await Promise.all([
      pubClient.connect(),
      subClient.connect(),
      keySub.connect(),
    ]);

    // 🔑 enable keyspace notifications for expired keys
    await pubClient.configSet("notify-keyspace-events", "Ex");

    // listen for TTL expiration events
    await keySub.pSubscribe("__keyevent@0__:expired", async (key) => {
      if (key.startsWith("online:")) {
        const userId = key.split(":")[1];
        handleUserOffline(userId, io, pubClient);
      }
    });

    // Handle new connection
    io.on("connection", async (socket) => {
      const userId = socket.userId;
      const socketId = socket.id;

      // Store mapping in Redis (with TTL in case of unexpected disconnect)
      await pubClient.set(`socket:${socketId}`, userId);
      await pubClient.set(`user:${userId}`, socketId);
      await pubClient.set(`online:${userId}`, "1", { EX: 45 });

      // Attach handlers
      disconnectionHandler(io, socket);

      heartbeatHandler(socket, io, pubClient);

      connectionHandler(io, socket);
      roomHandler(io, socket);
      messageHandler(io, socket);
    });
  } catch (ex) {
    console.error(ex);
    process.exit(-1);
  }
};

module.exports.getIO = () => io;
