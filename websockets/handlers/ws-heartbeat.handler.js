const chatsService = require("../../src/chats/chats.service");

module.exports.heartbeatHandler = (socket, io, redisClient) => {
  socket.conn.on("packet", async (packet) => {
    if (packet.type === "pong") {
      const userId = socket.userId;
      await redisClient.set(`online:${userId}`, "1", { EX: 45 });
      const { data: chatIds } = await chatsService.getUserChatIds(userId);
      if (chatIds.length > 0) {
        chatIds.forEach((chatId) => {
          io.emit(`chat:${chatId}`, {
            userId,
            isOnline: true,
            lastSeen: null,
          });
        });
      }
    }
  });
};
