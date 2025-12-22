const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const usersService = require("../../users/users.service");
const chatsService = require("../chats.service");
const chatMessagesService = require("./messages.service");
const collectionsService = require("../../collections/collections.service");
const blockedUserService = require("../../blocked-users/blocked-users.service");
const {
  CHAT_MESSAGE_TYPES,
  VIEW_STATUS,
  VIEW_TYPE,
  DELETE_TYPE,
} = require("../constants/chats.constants");
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

exports.isMessageOwner = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { id: messageId } = req.params;

    const result = await chatMessagesService.findById(messageId);

    if (result.ex) throw result.ex;

    if (result.messageNotFound)
      throw createError(StatusCodes.NOT_FOUND, "Message Not found");

    const chatId = result.data.chatId;

    const resp = await chatsService.findById(chatId);

    const chat = resp.data;

    const otherUser = chat.participants.filter(
      (participant) => participant != userId
    )[0];

    req.body.otherUser = otherUser;

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.isMessageReciever = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { id: messageId } = req.params;

    const result = await chatMessagesService.checkMessageReciever({
      userId,
      messageId,
    });

    if (result.ex) throw result.ex;

    if (result.messageNotFound)
      throw createError(StatusCodes.NOT_FOUND, "Message Not found");
    if (result.userNotReciever)
      throw createError(StatusCodes.FORBIDDEN, "User Not message reciever");

    if (result.data) {
      req.body.chatId = result?.data?.chatId;
    }

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.checkChatMemberByMessageId = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { id: messageId } = req.params;

    const messageResp = await chatMessagesService.findById(messageId);
    if (messageResp.ex) throw messageResp.ex;

    if (messageResp.messageNotFound)
      throw createError(StatusCodes.NOT_FOUND, "Message Not found");

    const chatId = messageResp.data.chatId;

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

exports.checkChatMember = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { chatId } = req.body;

    const [result, sendersResp] = await Promise.all([
      chatsService.findById(chatId),
      usersService.findById(userId),
    ]);

    if (result.chatNotFound)
      throw createError(StatusCodes.NOT_FOUND, "Chat Not found");

    if (sendersResp.userNotFound)
      throw createError(StatusCodes.NOT_FOUND, "User Not found");

    const chat = result.data;
    const sender = sendersResp.data;

    const isMember = chat.participants.includes(userId);

    if (!isMember)
      throw createError(StatusCodes.FORBIDDEN, "User Not found in chat");

    const otherUser = chat.participants.filter(
      (participant) => participant != userId
    )[0];

    req.body.otherUser = otherUser;
    req.body.sender = sender;

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.checkBlockedMember = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { otherUser } = req.body;

    const result = await blockedUserService.findOne({
      blockerId: otherUser,
      blockedId: userId,
    });

    if (result.data)
      throw createError(StatusCodes.UNAUTHORIZED, "You are blocked");

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.checkChatMemberListing = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { chatId } = req.query;

    const [chatResp, collectionsResp] = await Promise.all([
      chatsService.findById(chatId),
      collectionsService.findOne({ userId, collectionId: chatId }),
    ]);

    if (chatResp.chatNotFound)
      throw createError(StatusCodes.NOT_FOUND, "Chat Not found");

    const chat = chatResp.data;

    const isMember = chat.participants.includes(userId);

    if (!isMember)
      throw createError(StatusCodes.FORBIDDEN, "User Not found in chat");

    const clearedEntry = collectionsResp?.data?.clearedMessageId;

    if (clearedEntry) {
      req.query.messageFilterId = clearedEntry;
    }
    const otherUser = chat.participants.filter(
      (participant) => participant != userId
    )[0];

    const blockedResult = await blockedUserService.findOne({
      blockerId: otherUser,
      blockedId: userId,
    });
    if (blockedResult.ex) throw blockedResult.ex;

    if (blockedResult.data) {
      req.query.isBlocked = blockedResult.data ? true : false;
      req.query.blockedAt = blockedResult.data
        ? blockedResult.data.createdAt
        : null;
    }

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.isSingleViewMessage = async (req, res, next) => {
  try {
    const { id: messageId } = req.params;

    const result = await chatMessagesService.findById(messageId);

    if (result.ex) throw result.ex;

    if (result.messageNotFound)
      throw createError(StatusCodes.NOT_FOUND, "Message Not found");

    const message = result.data;

    if (message.viewType !== VIEW_TYPE.ONE_TIME_VIEW)
      throw createError(StatusCodes.NOT_FOUND, "Message Not one time View ");

    if (message.viewStatus !== VIEW_STATUS.UNOPENED)
      throw createError(StatusCodes.NOT_FOUND, "Message Alredy Viewed");

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.checkChatMemberByMessages = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { messageIds, deleteType } = req.body;

    const messageResp = await chatMessagesService.find({
      _id: { $in: messageIds },
      ...(deleteType == DELETE_TYPE.DELETE_FOR_EVERYONE && { sender: userId }),
    });

    if (messageResp.ex) throw messageResp.ex;

    if (messageResp.data.length !== messageIds.length)
      throw createError(
        StatusCodes.FORBIDDEN,
        "Some messages either do not exist or were not sent by you"
      );

    const messages = messageResp.data;

    const uniqueChatIds = [
      ...new Set(messages.map((m) => m.chatId.toString())),
    ];

    if (uniqueChatIds.length > 1) {
      throw createError(400, "All messages must belong to the same chat");
    }

    const chatId = uniqueChatIds[0];

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
    req.body.chatId = chatId;

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.checkChatMessagesDeleteStatus = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { messageIds, deleteType } = req.body;

    const messageResp = await chatMessagesService.find({
      _id: { $in: messageIds },
      ...(deleteType == DELETE_TYPE.DELETE_FOR_EVERYONE && {
        sender: userId,
        isDeletedForEveryone: true,
      }),
    });

    if (messageResp.ex) throw messageResp.ex;

    if (messageResp.data.length !== messageIds.length)
      throw createError(
        StatusCodes.FORBIDDEN,
        "Some messages either do not exist or were not sent by you"
      );

    const messages = messageResp.data;

    const uniqueChatIds = [
      ...new Set(messages.map((m) => m.chatId.toString())),
    ];

    if (uniqueChatIds.length > 1) {
      throw createError(400, "All messages must belong to the same chat");
    }

    const chatId = uniqueChatIds[0];

    const result = await chatsService.findById(chatId);

    if (result.chatNotFound)
      throw createError(StatusCodes.NOT_FOUND, "Chat Not found");

    const chat = result.data;

    const isMember = chat.participants.includes(userId);

    if (!isMember)
      throw createError(StatusCodes.FORBIDDEN, "User Not found in chat");

    if (deleteType == DELETE_TYPE.DELETE_FOR_ME) {
      messages.forEach((message) => {
        const isDeletedForUser = message.deletedFor.some(
          (id) => id?.toString() === userId?.toString()
        );
        if (!isDeletedForUser) {
          throw createError(
            StatusCodes.FORBIDDEN,
            "Some messages were not deleted"
          );
        }
      });
    }

    const otherUser = chat.participants.filter(
      (participant) => participant != userId
    )[0];

    req.body.otherUser = otherUser;
    req.body.chatId = chatId;

    next();
  } catch (ex) {
    next(ex);
  }
};
