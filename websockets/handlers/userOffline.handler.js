const chatsService = require("../../src/chats/chats.service");

module.exports.handleUserOffline = async (userId, io, redisClient) => {
  try {
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
  } catch (ex) {
    console.log(ex);
  }
};
