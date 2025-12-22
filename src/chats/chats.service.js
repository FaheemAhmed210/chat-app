const Chat = require("./chats.model");
const usersService = require("../users/users.service");
const chatMessagesService = require("./messages/messages.service");
const collectionsService = require("../collections/collections.service");

const { toObjectId } = require("../common/moongoose/to-object-id");
exports.create = async (createChatsDto, result = {}) => {
  try {
    const { userId, participant } = createChatsDto;

    let chat = await Chat.findOne({
      participants: { $all: [userId, participant] },
    });

    let unreadCount = 0;

    if (!chat) {
      const participants = [userId, participant];

      chat = await Chat.create({ participants });
    } else {
      const collectionResp = await collectionsService.findOne({
        userId,
        collectionId: chat._id,
      });

      if (collectionResp.data) {
        const { lastMessageRead } = collectionResp.data;

        const messagesResp = await chatMessagesService.countDocuments({
          chatId: chat._id,
          ...(lastMessageRead && { _id: { $gt: lastMessageRead } }),
          "sender._id": {
            $ne: toObjectId(userId),
          },
        });

        unreadCount = messagesResp.data;
      }
    }

    const userResp = await usersService.findUserById(participant);

    const user = userResp?.data;

    result.data = {
      ...chat._doc,
      user,
      unreadCount,
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.muteChat = async (muteChatsDto, result = {}) => {
  try {
    const { userId, chatId, isMuted, duration } = muteChatsDto;

    const now = Date.now();

    const mutedTillDate =
      duration == "8h"
        ? new Date(now + 8 * 60 * 60 * 1000)
        : duration == "1w"
        ? new Date(now + 7 * 24 * 60 * 60 * 1000)
        : null;

    const chatUpdate = await collectionsService.findOneAndUpdate(
      { collectionId: chatId, userId },
      {
        $set: {
          isMuted,
          ...(isMuted && { mutedTill: mutedTillDate, mutedType: duration }),
        },
      },
      { new: true }
    );
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.listChats = async (listChatsDto, result = {}) => {
  try {
    const { offset, limit, userId } = listChatsDto;

    const userObjectId = toObjectId(userId);

    const filter = {
      participants: {
        $in: [userObjectId],
      },
      firstMessageSent: true,
    };

    const [chats, count] = await Promise.all([
      Chat.find(filter)
        .sort({ lastUpdated: -1 })
        .skip((offset - 1) * limit)
        .limit(+limit),
      Chat.countDocuments(filter),
    ]);

    result.data = {
      chats,
      pages: Math.ceil(count / +limit),
      count,
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getChatById = async (getChatByIdsDto, result = {}) => {
  try {
    const { chatId, userId } = getChatByIdsDto;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: {
        $in: [toObjectId(userId)],
      },
    })
      .populate("lastMessage")
      .lean();

    if (!chat) {
      result.chatNotFound = true;
    } else {
      const otherUserId = chat.participants.filter(
        (participant) => participant != userId
      )[0];

      const userResp = await usersService.findUserById(otherUserId);
      const user = userResp.data;
      result.data = { ...chat, user };
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findById = async (chatId, result = {}) => {
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      result.chatNotFound = true;
    } else {
      result.data = chat;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findOne = async (findsDto, result = {}) => {
  try {
    const chat = await Chat.findOne(findsDto);
    if (!chat) {
      result.chatNotFound = true;
    } else {
      result.data = chat;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findByIdAndUpdate = async (chatId, chatUpdateDto, result = {}) => {
  try {
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      {
        ...chatUpdateDto,
      },
      { new: true }
    );

    if (!chat) {
      result.chatNotFound = true;
    } else {
      result.data = chat;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getUserChatIds = async (userId, result = {}) => {
  try {
    const chatIds = await Chat.find({
      participants: {
        $in: [toObjectId(userId)],
      },
    }).select({
      _id: 1,
    });

    // Convert to array of group IDs
    if (chatIds.length === 0) {
      result.data = [];
    } else if (chatIds.length === 1) {
      result.data = [chatIds[0]._id.toString()];
    } else if (chatIds.length > 1) {
      result.data = chatIds.map((g) => g._id.toString());
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.clearChat = async (clearChatsDto, result = {}) => {
  try {
    const { userId, chatId } = clearChatsDto;

    const lastMessage = await chatMessagesService.getLastMessage(chatId);

    result.data = await collectionsService.findOneAndUpdate(
      { collectionId: toObjectId(chatId), userId },
      { clearedMessageId: lastMessage?.data?._id }
    );
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.deleteChat = async (clearChatsDto, result = {}) => {
  try {
    const { userId, chatId } = clearChatsDto;

    const lastMessage = await chatMessagesService.getLastMessage(chatId);

    result.data = await collectionsService.findOneAndUpdate(
      { collectionId: chatId, userId },
      { clearedMessageId: lastMessage?.data?._id, isDeleted: true }
    );
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getData = async (getDatasDto, result = {}) => {
  try {
    const { startTime, endTime, previousTime } = getDatasDto;

    const filter = {
      ...(startTime &&
        endTime && {
          createdAt: {
            $gte: startTime,
            $lte: endTime,
          },
        }),
    };

    const [count, percentage] = await Promise.all([
      Chat.countDocuments(filter),
      Chat.aggregate([
        {
          $match: {
            createdAt: { $gte: previousTime, $lte: endTime }, // Users created yesterday
          },
        },
        {
          $group: {
            _id: {
              $cond: [
                { $gte: ["$createdAt", startTime] },
                "today",
                "yesterday",
              ],
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            currentCount: {
              $sum: {
                $cond: [{ $eq: ["$_id", "today"] }, "$count", 0],
              },
            },
            previousCount: {
              $sum: {
                $cond: [{ $eq: ["$_id", "yesterday"] }, "$count", 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            currentCount: 1,
            previousCount: 1,
            percentageDifference: {
              $cond: [
                { $gt: ["$previousCount", 0] },
                {
                  $round: [
                    {
                      $multiply: [
                        {
                          $divide: [
                            { $subtract: ["$currentCount", "$previousCount"] },
                            "$previousCount",
                          ],
                        },
                        100,
                      ],
                    },
                    2, // number of decimal places
                  ],
                },
                100,
              ],
            },
          },
        },
      ]),
    ]);
    result.data = {
      count,
      ...percentage[0],
    };
  } catch (ex) {
    console.log(ex);
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.updateChatStatus = async (updateStatusDto, result = {}) => {
  try {
    const { chatId, status, userId } = updateStatusDto;

    const lastMessage = await chatMessagesService.getLastMessage(chatId);

    if (lastMessage.data) {
      const messageId = lastMessage.data._id.toString();

      const updateMessagesResp = await chatMessagesService.updateMessageStatus({
        chatId,
        messageId,
        status,
        userId,
      });
      result.data = updateMessagesResp?.data;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
