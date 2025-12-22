const redisClient = require("../../helpers/redis");
const chatsService = require("../../src/chats/chats.service");

module.exports.disconnectionHandler = (io, socket) => {
  socket.on("disconnect", async (reason) => {
    try {
      console.log(
        `User disconnected: ${socket.userId} (${socket.id}) due to ${reason}`
      );
      const userId = socket.userId;

      const { data: chatIds } = await chatsService.getUserChatIds(userId);

      if (chatIds.length > 0) {
        chatIds.forEach((chatId) => {
          io.emit(`chat:${chatId}`, {
            userId,
            isOnline: false,
            lastSeen: Date.now().toString(),
          });
        });
      }

      await redisClient.set(`lastSeen:${userId}`, Date.now().toString());
      await redisClient.set(`online:${userId}`, "0");

      socket.leave(socket.id);

      await redisClient.del(socket.id);
    } catch (ex) {
      console.log(ex);
    }
  });
};

module.exports.connectionHandler = async (io, socket) => {
  try {
    const userId = socket.userId;

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
  } catch (ex) {
    console.log(ex);
  }
};
