const EVENT_STATUSES = require("../constants/event-status.constant");
const chatsService = require("../../src/chats/chats.service");
const redisClient = require("../../helpers/redis");

const handleMessages = (io, socket) => () => {
  socket.on("join_room", async (payload) => {
    try {
    } catch (err) {
      console.error(err);
      socket.emit("error", {
        status: EVENT_STATUSES.SERVER_ERR,
        message: "Something went wrong",
        event: "join_room_network:sent",
        details: null,
      });
    }
  });

  socket.on("join_chat", async (payload) => {
    try {
      const { chatId } = payload;

      const socketId = socket.id;

      const userId = await redisClient.get(`socket:${socketId}`);

      const { data: chat } = await chatsService.findById(chatId);

      if (chat) {
        const otherUser = chat.participants.find(
          (id) => id.toString() !== userId.toString()
        );

        const isOnline = await redisClient.get(`online:${otherUser}`);

        const lastSeen = await redisClient.get(`lastSeen:${otherUser}`);

        const roomName = `chat:${chatId}`;

        if (!socket.rooms.has(roomName)) {
          socket.join(roomName);
        }

        socket.emit(`chat:${chatId}`, {
          userId: otherUser,
          isOnline: isOnline == "1" ? true : false,
          lastSeen: lastSeen ? new Date(Number(lastSeen)).toISOString() : null,
        });

        socket.emit(`chat:${chatId}`, {
          userId,
          isOnline: true,
          lastSeen: null,
        });
      }
    } catch (err) {
      console.error(err);
      socket.emit("error", {
        status: EVENT_STATUSES.SERVER_ERR,
        message: "Something went wrong",
        event: "join_room_network:sent",
        details: null,
      });
    }
  });

  socket.on("typing", async (payload) => {
    try {
      const { chatId, typing } = payload;

      socket.to(`chat:${chatId}`).emit("typing", { chatId, typing });
    } catch (err) {
      console.error(err);
      socket.emit("error", {
        status: EVENT_STATUSES.SERVER_ERR,
        message: "Something went wrong",
        event: "join_room_network:sent",
        details: null,
      });
    }
  });
  socket.on("recording", async (payload) => {
    try {
      const { chatId, recording } = payload;

      socket.to(`chat:${chatId}`).emit("recording", { chatId, recording });
    } catch (err) {
      console.error(err);
      socket.emit("error", {
        status: EVENT_STATUSES.SERVER_ERR,
        message: "Something went wrong",
        event: "join_room_network:sent",
        details: null,
      });
    }
  });

  socket.on("group_typing", async (payload) => {
    try {
      const { groupId, typing, userName } = payload;

      socket
        .to(groupId.toString())
        .emit("group_typing", { groupId, typing, userName });
    } catch (err) {
      console.error(err);
      socket.emit("error", {
        status: EVENT_STATUSES.SERVER_ERR,
        message: "Something went wrong",
        event: "join_room_network:sent",
        details: null,
      });
    }
  });
  socket.on("group_recording", async (payload) => {
    try {
      const { groupId, recording, userName } = payload;

      socket
        .to(groupId.toString())
        .emit("group_recording", { groupId, recording, userName });
    } catch (err) {
      console.error(err);
      socket.emit("error", {
        status: EVENT_STATUSES.SERVER_ERR,
        message: "Something went wrong",
        event: "join_room_network:sent",
        details: null,
      });
    }
  });
};

module.exports = (io, socket) => {
  handleMessages(io, socket)();
};
