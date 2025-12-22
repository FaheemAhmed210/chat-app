const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const usersService = require("../users/users.service");
const chatsService = require("./chats.service");

exports.checkParticipant = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { participant } = req.body;

    if (participant == userId) {
      throw createError(
        StatusCodes.FORBIDDEN,
        "Forbidden. Cant create chat with self"
      );
    }
    const result = await usersService.findById(participant);

    if (result.ex) throw result.ex;
    const user = result.data;

    if (!user) throw createError(StatusCodes.NOT_FOUND, "User Not found");

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.checkChatMember = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { id: chatId } = req.params;

    const result = await chatsService.findById(chatId);

    if (result.chatNotFound)
      throw createError(StatusCodes.NOT_FOUND, "Chat Not found");

    const chat = result.data;

    const isMember = chat.participants.includes(userId);

    if (!isMember)
      throw createError(StatusCodes.FORBIDDEN, "User Not found in chat");

    const otherUser = chat.participants.filter(
      (participant) => participant != userId
    )[0];

    req.body.otherUser = otherUser;

    next();
  } catch (ex) {
    next(ex);
  }
};
