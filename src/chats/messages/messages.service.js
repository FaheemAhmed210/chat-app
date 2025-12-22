const ChatMessage = require("./messages.model");
const {
  DELETE_TYPE,
  VIEW_TYPE,
  VIEW_STATUS,
} = require("../constants/chats.constants");
const mongoose = require("mongoose");
const { TOPIC_NAMES } = require("../../common/kafka/constants/kafka.constants");
const ChatsQueue = require("../../../subscribers/queues/chats-queue");
const collectionsService = require("../../collections/collections.service");
const chatsService = require("../chats.service");
exports.create = async (createMessageDto, result = {}) => {
  try {
    const { userId, sender, otherUser, ...restData } = createMessageDto;

    const viewType = createMessageDto?.viewType || VIEW_TYPE.STANDARD;

    const messageCreate = await ChatMessage.create({
      sender,
      receiver: otherUser,
      ...restData,

      ...(viewType == VIEW_TYPE.ONE_TIME_VIEW && {
        viewStatus: VIEW_STATUS.UNOPENED,
      }),
    });

    if (messageCreate) {
      populatedMessage = await ChatMessage.findById(messageCreate._id)
        .populate(
          "receiver",
          "userName displayName profileImage fcmToken platformName"
        )
        .populate({
          path: "replyTo",
          select: "content sender viewType viewStatus",
        })
        .lean();
      const { receiver } = populatedMessage;
      await Promise.all([
        ChatsQueue.add(
          {
            message: populatedMessage,
            sendPushNotification: true,
            eventType: TOPIC_NAMES.CREATE_CHAT_MESSAGE,
          },
          {
            jobId: `chat_message_${populatedMessage._id}_0`,
            removeOnComplete: true,
            attempts: 5,
            backoff: { type: "exponential", delay: 10000 },
          }
        ),
        collectionsService.findOneAndUpdate(
          {
            collectionId: messageCreate.chatId,
            userId: sender._id,
          },
          {
            lastUpdated: Date.now(),
            isDeleted: false,
            collectionName: receiver?.displayName,
            collectionImage: receiver?.profileImage,
            otherUser: receiver._id,
          }
        ),
        collectionsService.findOneAndUpdate(
          {
            collectionId: messageCreate.chatId,
            userId: receiver._id,
          },
          {
            lastUpdated: Date.now(),
            isDeleted: false,
            collectionName: sender?.displayName,
            collectionImage: sender?.profileImage,
            otherUser: sender._id,
            unreadMessageCount: 1,
          }
        ),

        chatsService.findByIdAndUpdate(messageCreate.chatId, {
          firstMessageSent: true,
        }),
      ]);

      result.data = populatedMessage;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.updateMessageStatus = async (updateMessageStatusDto, result = {}) => {
  try {
    const { messageId, status, userId, chatId } = updateMessageStatusDto;
    const userObjectId = mongoose.Types.ObjectId.createFromHexString(userId);

    const [restMessages, unreadCount] = await Promise.all([
      ChatMessage.updateMany(
        {
          chatId,
          "sender._id": {
            $ne: userObjectId,
          },
          _id: { $lte: messageId },
        },
        { status }
      ),
      ChatMessage.countDocuments({
        chatId,
        _id: { $gt: messageId },
        "sender._id": {
          $ne: userObjectId,
        },
      }),
    ]);

    const [message, collectionsResp] = await Promise.all([
      ChatMessage.findOne({
        _id: {
          $lte: mongoose.Types.ObjectId.createFromHexString(messageId),
        },
        "sender._id": {
          $ne: userObjectId,
        },
        ...(chatId && { chatId }),
      })
        .populate("receiver", "userName profileImage")
        .populate({
          path: "replyTo",
          select: "content sender viewType viewStatus",
        })
        .sort({ _id: -1 })
        .lean(),
      collectionsService.findOneAndUpdate(
        {
          userId: userObjectId,
          collectionId: chatId,
        },
        {
          lastMessageRead: messageId,
          unreadCount,
        },
        { new: true }
      ),
    ]);

    if (!message) {
      result.messageNotFound = true;
    } else {
      await ChatsQueue.add(
        {
          message,
          sendPushNotification: false,
          eventType: TOPIC_NAMES.UPDATE_CHAT_MESSAGE_STATUS,
        },
        {
          jobId: `chat_message_${message._id}_1`,
          removeOnComplete: true,
          attempts: 5,
          backoff: { type: "exponential", delay: 10000 },
        }
      );

      result.data = message;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.updateSingleViewStatus = async (
  updateMessageStatusDto,
  result = {}
) => {
  try {
    const { messageId, status } = updateMessageStatusDto;

    const message = await ChatMessage.findByIdAndUpdate(
      messageId,
      {
        $set: { viewStatus: status },
      },
      { new: true }
    )

      .populate("receiver", "userName profileImage")
      .populate({
        path: "replyTo",
        select: "content sender viewType viewStatus",
      });
    if (!message) {
      result.messageNotFound = true;
    } else {
      await ChatsQueue.add(
        {
          message,
          sendPushNotification: false,
          eventType: TOPIC_NAMES.UPDATE_CHAT_MESSAGE,
        },
        {
          jobId: `chat_message_${message._id}_2`,
          removeOnComplete: true,
          attempts: 5,
          backoff: { type: "exponential", delay: 10000 },
        }
      );

      result.data = message;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.updateMessage = async (updateMessageDto, result = {}) => {
  try {
    const { messageId, otherUser, content, messageAccess } = updateMessageDto;
    const isEdited = updateMessageDto.isEdited ?? true;

    const updatePayload = {
      ...(content?.body && { "content.body": content?.body }),

      ...(content?.metaData && {
        "content.metaData": content?.metaData,
      }),
      ...(messageAccess && {
        messageAccess,
      }),
    };

    const message = await ChatMessage.findByIdAndUpdate(
      messageId,
      { $set: updatePayload, isEdited },
      { new: true }
    )

      .populate("receiver", "userName profileImage")
      .populate({
        path: "replyTo",
        select: "content sender viewType viewStatus",
      });
    if (!message) {
      result.messageNotFound = true;
    } else {
      await ChatsQueue.add(
        {
          message,
          sendPushNotification: false,
          eventType: TOPIC_NAMES.UPDATE_CHAT_MESSAGE,
        },
        {
          jobId: `chat_message_${message._id}_3`,
          removeOnComplete: true,
          attempts: 5,
          backoff: { type: "exponential", delay: 10000 },
        }
      );

      result.data = message;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.checkMessageReciever = async (
  checkMessageRecieversDto,
  result = {}
) => {
  try {
    const { messageId, userId } = checkMessageRecieversDto;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      result.messageNotFound = true;
    } else if (
      message.receiver.toString() !== userId &&
      message.sender._id.toString() !== userId
    ) {
      result.userNotReciever = true;
    } else {
      result.data = message;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.deleteMessage = async (deleteMessagesDto, result = {}) => {
  try {
    const { messageId, deleteType, userId } = deleteMessagesDto;

    const message = await ChatMessage.findByIdAndUpdate(
      messageId,
      {
        ...(deleteType == DELETE_TYPE.DELETE_FOR_ME
          ? {
              $push: {
                deletedFor: userId,
              },
            }
          : { isDeletedForEveryone: true }),
      },
      { new: true }
    );

    if (!message) {
      result.messageNotFound = true;
    } else {
      if (deleteType === DELETE_TYPE.DELETE_FOR_EVERYONE) {
        await ChatsQueue.add(
          {
            message,
            sendPushNotification: false,
            eventType: TOPIC_NAMES.DELETE_CHAT_MESSAGE,
          },
          {
            jobId: `chat_message_${populatedMessage._id}_5`,
            removeOnComplete: true,
            attempts: 5,
            backoff: { type: "exponential", delay: 10000 },
          }
        );
      }

      result.data = message;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.deleteMessages = async (deleteMessagesDto, result = {}) => {
  try {
    const { messageIds, deleteType, userId, otherUser, chatId } =
      deleteMessagesDto;

    const messages = await ChatMessage.updateMany(
      { _id: { $in: messageIds } },
      {
        ...(deleteType == DELETE_TYPE.DELETE_FOR_ME
          ? {
              $addToSet: {
                deletedFor: userId,
              },
            }
          : { isDeletedForEveryone: true }),
      },
      { new: true }
    );

    if (messages) {
      const updated = await ChatMessage.find({
        _id: { $in: messageIds },
      }).lean();
      if (deleteType === DELETE_TYPE.DELETE_FOR_EVERYONE) {
        const io = webSockets.getIO();
        io.to(otherUser.toString()).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
          eventType: TOPIC_NAMES.DELETE_MULTIPLE_CHAT_MESSAGES,
          message: updated,
          sender: userId,
          receiver: otherUser,
          chatId,
        });
      }
      result.data = updated;
    }
  } catch (ex) {
    console.log(ex);

    result.ex = ex;
  } finally {
    return result;
  }
};

exports.undoDeleteMessages = async (deleteMessagesDto, result = {}) => {
  try {
    const { messageIds, deleteType, userId, otherUser, chatId } =
      deleteMessagesDto;

    const messages = await ChatMessage.updateMany(
      { _id: { $in: messageIds } },
      {
        ...(deleteType == DELETE_TYPE.DELETE_FOR_ME
          ? {
              $pull: {
                deletedFor: userId,
              },
            }
          : { isDeletedForEveryone: false }),
      },
      { new: true }
    );

    if (messages) {
      const updated = await ChatMessage.find({
        _id: { $in: messageIds },
      })
        .populate("sender", "userName displayName profileImage")
        .populate("escrow")
        .populate(
          "receiver",
          "userName displayName profileImage fcmToken platformName"
        )
        .populate({
          path: "replyTo",
          select: "content sender viewType viewStatus",
          populate: {
            path: "sender",
            select: "userName profileImage",
          },
        })
        .lean();
      if (deleteType === DELETE_TYPE.DELETE_FOR_EVERYONE) {
        const io = webSockets.getIO();
        io.to(otherUser.toString()).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
          eventType: TOPIC_NAMES.UNDO_DELETE_MULTIPLE_CHAT_MESSAGES,
          message: updated,
          sender: userId,
          receiver: otherUser,
          chatId,
        });
      }
      result.data = updated;
    }
  } catch (ex) {
    console.log(ex);

    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findById = async (messageId, result = {}) => {
  try {
    const message = await ChatMessage.findById(messageId);
    if (!message) {
      result.messageNotFound = true;
    } else {
      result.data = message;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.findOne = async (findsDto, result = {}) => {
  try {
    const message = await ChatMessage.findOne(findsDto)
      .populate("sender", "userName displayName profileImage")
      .populate("escrow")
      .populate(
        "receiver",
        "userName displayName profileImage fcmToken platformName"
      )
      .populate({
        path: "replyTo",
        select: "content sender viewType viewStatus",
        populate: {
          path: "sender",
          select: "userName profileImage",
        },
      })
      .lean();
    if (!message) {
      result.messageNotFound = true;
    } else {
      result.data = message;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.find = async (findsDto, result = {}) => {
  try {
    result.data = await ChatMessage.find(findsDto).lean();
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.reactToMesage = async (reactToMesageDto, result = {}) => {
  try {
    const { messageId, userId, otherUser, name, emoji, slug } =
      reactToMesageDto;

    const existing = await ChatMessage.findOne(
      {
        _id: messageId,
        "reactedBy.userId": userId,
      },
      {
        "reactedBy.$": 1,
      }
    );

    let message;

    if (existing && existing.reactedBy.length > 0) {
      const existingEmoji = existing.reactedBy[0].emoji;

      if (existingEmoji === emoji) {
        message = await ChatMessage.findByIdAndUpdate(
          messageId,
          { $pull: { reactedBy: { userId: userId } } },
          { new: true }
        )

          .populate("receiver", "userName profileImage")
          .populate({
            path: "replyTo",
            select: "content sender viewType viewStatus",
          })
          .populate({
            path: "reactedBy.userId",
            select: "userName profileImage", // only get these fields
          });
      } else {
        message = await ChatMessage.findOneAndUpdate(
          { _id: messageId, "reactedBy.userId": userId },
          {
            $set: {
              "reactedBy.$.emoji": emoji,
              "reactedBy.$.slug": slug,
            },
          },
          { new: true }
        )

          .populate("receiver", "userName profileImage")
          .populate({
            path: "replyTo",
            select: "content sender viewType viewStatus",
          })
          .populate({
            path: "reactedBy.userId",
            select: "userName profileImage", // only get these fields
          });
      }
    } else {
      // ➕ No reaction yet: Add new reaction
      message = await ChatMessage.findByIdAndUpdate(
        messageId,
        {
          $push: {
            reactedBy: {
              userId,
              name,
              emoji,
              slug,
            },
          },
        },
        { new: true }
      )

        .populate("receiver", "userName profileImage")
        .populate({
          path: "replyTo",
          select: "content sender viewType viewStatus",
        })
        .populate({
          path: "reactedBy.userId",
          select: "userName profileImage", // only get these fields
        });
    }

    if (!message) {
      result.messageNotFound = true;
    } else {
      await ChatsQueue.add(
        {
          message,
          sendPushNotification: false,
          eventType: TOPIC_NAMES.REACT_CHAT_MESSAGE,
        },
        {
          jobId: `chat_message_${message._id}_4`,
          removeOnComplete: true,
          attempts: 5,
          backoff: { type: "exponential", delay: 10000 },
        }
      );

      result.data = message;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.listMessages = async (listMessagesDto, result = {}) => {
  try {
    const {
      cursor: nextCursor,
      limit,
      chatId,
      userId,
      types,
      messageFilterId,
      isBlocked,
      blockedAt,
    } = listMessagesDto;

    const filter = {
      chatId,

      $or: [
        { isDeletedForEveryone: false },
        { deletedFor: { $nin: [userId] } },
      ],

      ...(nextCursor &&
        mongoose.Types.ObjectId.isValid(nextCursor) && {
          _id: { $lt: nextCursor },
        }),

      ...(types && {
        "content.type": Array.isArray(types) ? { $in: types } : types,
        viewType: { $ne: VIEW_TYPE.ONE_TIME_VIEW },
      }),

      ...(messageFilterId && { _id: { $gt: messageFilterId } }),
    };

    if (filter.types) {
      if (Array.isArray(filter.types)) {
        query.type = { $in: filter.types };
      } else {
        query.type = filter.types;
      }
    }
    if (isBlocked) {
      filter.createdAt = { $lt: blockedAt };
    }

    const chatMessages = await ChatMessage.find(filter)
      .sort({ _id: -1 })
      .limit(limit)

      .populate({
        path: "replyTo",
        select: "content sender viewType viewStatus",
      })
      .populate("escrow")
      .populate({
        path: "reactedBy.userId",
        select: "displayName profileImage", // only get these fields
      });

    result.data = {
      chatMessages,
      nextCursor:
        chatMessages.length === limit
          ? chatMessages[chatMessages.length - 1]?._id
          : null,
      hasNextPage: chatMessages.length === limit,
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getLastMessage = async (chatId, result = {}) => {
  try {
    const chatMessage = await ChatMessage.findOne({ chatId })
      .sort({ _id: -1 })
      .limit(1);

    if (!chatMessage) {
      result.chatMessageNotFound = true;
    } else {
      result.data = chatMessage;
    }
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
      ChatMessage.countDocuments(filter),
      ChatMessage.aggregate([
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

exports.updateEscrowStatus = async (updateMessageDto, result = {}) => {
  try {
    const { escrow, status } = updateMessageDto;

    const message = await ChatMessage.updateMany(
      { escrow },
      { $set: { "content.metaData.status": status } }
    );

    if (!message) {
      result.messageNotFound = true;
    } else {
      result.data = message;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.countDocuments = async (countDocumentsDto, result = {}) => {
  try {
    result.data = await ChatMessage.countDocuments(countDocumentsDto);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
