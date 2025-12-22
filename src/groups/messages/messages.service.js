const GroupMessage = require("./messages.model");
const mongoose = require("mongoose");
const {
  DELETE_TYPE,
  MESSAGE_STATUS,
  VIEW_TYPE,
  VIEW_STATUS,
} = require("../constants/groups.constants");
const { TOPIC_NAMES } = require("../../common/kafka/constants/kafka.constants");

const participantsService = require("../participants/participants.service");
const messageStatusService = require("../message-status/messages-status.service");
const messageOpenStatusService = require("../message-open-status/messages-open-status.service");
const blockedMembersService = require("../../blocked-members/blocked-members.service");
const pinnedMessagesService = require("../pinned-messages/pinned-messages.service");
const collectionsService = require("../../collections/collections.service");

const redisClient = require("../../../helpers/redis");
const GroupsQueue = require("../../../subscribers/queues/groups-queue");

exports.create = async (createMessageDto, result = {}) => {
  try {
    const { userId, sender, ...restData } = createMessageDto;

    const viewType = createMessageDto?.viewType || VIEW_TYPE.STANDARD;
    const groupId = restData.groupId;

    const messageCreate = await GroupMessage.create({
      sender,
      ...restData,
      ...(viewType == VIEW_TYPE.ONE_TIME_VIEW && {
        viewStatus: VIEW_STATUS.UNOPENED,
      }),
    });

    if (messageCreate) {
      const groupParticipantsResp = await participantsService.getGroupUsers({
        groupId: messageCreate.groupId,
      });

      const groupParticipants = groupParticipantsResp.data;

      const [populatedMessage, messageStatusResp] = await Promise.all([
        GroupMessage.findById(messageCreate._id)
          .populate({
            path: "replyTo",
            select: "content sender viewType viewStatus",
            populate: {
              path: "sender",
              select: "userName profileImage",
            },
          })
          .populate({
            path: "reactedBy.userId",
            select: "userName profileImage", // only get these fields
          })
          .lean(),
        messageStatusService.create({
          messageId: messageCreate._id,
          groupId: messageCreate.groupId,
          sender: messageCreate.sender,
          totalCount: groupParticipants.length - 1,
        }),
        viewType === VIEW_TYPE.ONE_TIME_VIEW &&
          messageOpenStatusService.create({
            messageId: messageCreate._id,
            groupId: messageCreate.groupId,
            sender: messageCreate.sender,
            totalCount: groupParticipants.length - 1,
          }),
      ]);

      await Promise.all([
        GroupsQueue.add(
          {
            message: populatedMessage,
            sendPushNotification: true,
            eventType: TOPIC_NAMES.CREATE_GROUP_MESSAGE,
            emitId: groupId,
          },
          {
            jobId: `group_message_${populatedMessage._id}_0`,
            removeOnComplete: true,
            attempts: 5,
            backoff: { type: "exponential", delay: 10000 },
          }
        ),
        collectionsService.updateMany(
          {
            collectionId: messageCreate.groupId,
            userId: { $ne: sender._id },
          },
          {
            lastUpdated: Date.now(),
            unreadMessageCount: 1,
          }
        ),
        collectionsService.findOneAndUpdate(
          {
            collectionId: messageCreate.groupId,
            userId: sender._id,
          },
          {
            lastUpdated: Date.now(),
          }
        ),
      ]);

      result.data = populatedMessage;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.createMessage = async (createMessageDto, result = {}) => {
  try {
    const messageCreate = await GroupMessage.create(createMessageDto);

    if (messageCreate) {
      const socketId = await redisClient.get(`user:${messageCreate.reciever}`);

      await Promise.all([
        GroupsQueue.add(
          {
            message: populatedMessage,
            sendPushNotification: false,
            eventType: TOPIC_NAMES.CREATE_GROUP_MESSAGE,
            emitId: socketId,
          },
          {
            jobId: `group_message_${populatedMessage._id}_1`,
            removeOnComplete: true,
            attempts: 5,
            backoff: { type: "exponential", delay: 10000 },
          }
        ),
        collectionsService.findOneAndUpdate(
          {
            collectionId: messageCreate.groupId,
            userId: messageCreate.reciever,
          },
          {
            lastUpdated: Date.now(),
            unreadMessageCount: 1,
          }
        ),
      ]);

      result.data = messageCreate;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.updateMessage = async (updateMessageDto, result = {}) => {
  try {
    const { messageId, content, messageAccess, userId } = updateMessageDto;

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

    const populatedMessage = await GroupMessage.findByIdAndUpdate(
      messageId,
      { $set: updatePayload, isEdited },
      { new: true }
    ).populate({
      path: "replyTo",
      select: "content sender viewType viewStatus",
      populate: {
        path: "sender",
        select: "userName profileImage",
      },
    });
    if (!populatedMessage) {
      result.messageNotFound = true;
    } else {
      await GroupsQueue.add(
        {
          message: populatedMessage,
          sendPushNotification: false,
          eventType: TOPIC_NAMES.UPDATE_GROUP_MESSAGE,
          emitId: populatedMessage.groupId.toString(),
        },
        {
          jobId: `group_message_${populatedMessage._id}_2`,
          removeOnComplete: true,
          attempts: 5,
          backoff: { type: "exponential", delay: 10000 },
        }
      );
      result.data = populatedMessage;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findById = async (messageId, result = {}) => {
  try {
    const message = await GroupMessage.findById(messageId);
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
    result.data = await GroupMessage.find(findsDto);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.updateMessageStatus = async (updateMessageStatusDto, result = {}) => {
  try {
    const { groupId, userId, messageId } = updateMessageStatusDto;

    const messageStatusResp = await messageStatusService.updateMessageStatus(
      updateMessageStatusDto
    );

    if (messageStatusResp.ex) throw messageStatusResp.ex;
    const groupObjId =
      typeof groupId === "string"
        ? new mongoose.Types.ObjectId(groupId)
        : groupId;

    const messageIdsResp =
      await messageStatusService.getSeenAndDeliveredMessageIds(groupObjId);

    if (messageIdsResp.ex) throw messageIdsResp.ex;

    const { seenMessageIds, deliveredMessageIds } = messageIdsResp.data;

    if (deliveredMessageIds.length > 0) {
      const delivered = await GroupMessage.updateMany(
        { _id: { $in: deliveredMessageIds } },
        { $set: { messageStatus: MESSAGE_STATUS.DELIVERED } }
      );
    }
    if (seenMessageIds.length > 0) {
      await Promise.all([
        GroupMessage.updateMany(
          { _id: { $in: seenMessageIds } },
          { $set: { messageStatus: MESSAGE_STATUS.READ } }
        ),
        messageStatusService.deleteMany({
          messageId: { $in: seenMessageIds },
        }),
      ]);

      const message = await GroupMessage.findById(messageId).populate({
        path: "replyTo",
        select: "content sender viewType viewStatus",
      });

      await GroupsQueue.add(
        {
          message,
          sendPushNotification: false,
          eventType: TOPIC_NAMES.UPDATE_GROUP_MESSAGE_STATUS,
          emitId: groupId.toString(),
        },
        {
          jobId: `group_message_${message._id}_3`,
          removeOnComplete: true,
          attempts: 5,
          backoff: { type: "exponential", delay: 10000 },
        }
      );
    }

    result.data = true;
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
    const messageStatusResp =
      await messageOpenStatusService.updateMessageStatus(
        updateMessageStatusDto
      );

    if (messageStatusResp.ex) throw messageStatusResp.ex;

    const status = messageStatusResp.data;

    if (status) {
      const participantsCountResp = await participantsService.countDocuments({
        userId: { $ne: status.sender },
        groupId: status.groupId,
        createdAt: { $lte: status.createdAt },
      });

      if (participantsCountResp.ex) throw participantsCountResp.ex;
      const participantsCount = participantsCountResp.data;
      const totalOpened = status.openedBy.length;
      if (totalOpened >= participantsCount) {
        const populatedMessage = await GroupMessage.findByIdAndUpdate(
          status.messageId,
          {
            viewStatus: VIEW_STATUS.OPENED,
          },
          { new: true }
        )
          .populate("sender", "userName profileImage")
          .populate({
            path: "replyTo",
            select: "content sender viewType viewStatus",
            populate: {
              path: "sender",
              select: "userName profileImage",
            },
          });

        await messageOpenStatusService.deleteMany({
          messageId: status.messageId,
        });

        await GroupsQueue.add(
          {
            message: populatedMessage,
            sendPushNotification: false,
            eventType: TOPIC_NAMES.UPDATE_GROUP_MESSAGE,
            emitId: socketId,
          },
          {
            jobId: `group_message_${populatedMessage._id}_3`,
            removeOnComplete: true,
            attempts: 5,
            backoff: { type: "exponential", delay: 10000 },
          }
        );
      }
      result.data = status;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.reactToMesage = async (reactToMesageDto, result = {}) => {
  try {
    const { messageId, userId, name, emoji, slug } = reactToMesageDto;

    const existing = await GroupMessage.findOne(
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
        message = await GroupMessage.findByIdAndUpdate(
          messageId,
          { $pull: { reactedBy: { userId: userId } } },
          { new: true }
        )
          .populate("sender", "userName profileImage")
          .populate({
            path: "replyTo",
            select: "content sender viewType viewStatus",
            populate: {
              path: "sender",
              select: "userName profileImage",
            },
          })
          .populate({
            path: "reactedBy.userId",
            select: "userName profileImage", // only get these fields
          });
      } else {
        message = await GroupMessage.findOneAndUpdate(
          { _id: messageId, "reactedBy.userId": userId },
          {
            $set: {
              "reactedBy.$.emoji": emoji,
              "reactedBy.$.slug": slug,
            },
          },
          { new: true }
        )
          .populate("sender", "userName profileImage")
          .populate({
            path: "replyTo",
            select: "content sender viewType viewStatus",
            populate: {
              path: "sender",
              select: "userName profileImage",
            },
          })
          .populate({
            path: "reactedBy.userId",
            select: "userName profileImage", // only get these fields
          });
      }
    } else {
      // ➕ No reaction yet: Add new reaction
      message = await GroupMessage.findByIdAndUpdate(
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
        .populate("sender", "userName profileImage")

        .populate({
          path: "replyTo",
          select: "content sender viewType viewStatus",
          populate: {
            path: "sender",
            select: "userName profileImage",
          },
        })
        .populate({
          path: "reactedBy.userId",
          select: "userName profileImage", // only get these fields
        });
    }

    if (!message) {
      result.messageNotFound = true;
    } else {
      await GroupsQueue.add(
        {
          message,
          sendPushNotification: false,
          eventType: TOPIC_NAMES.REACT_GROUP_MESSAGE,
          emitId: message.groupId.toString(),
        },
        {
          jobId: `group_message_${message._id}_3`,
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
      nextCursor,
      limit,
      groupId,
      userId,
      types,
      messageFilterId,
      isBlocked,
    } = listMessagesDto;

    const userObjectId = mongoose.Types.ObjectId.createFromHexString(userId);

    const filter = {
      groupId: mongoose.Types.ObjectId.createFromHexString(groupId),
      deletedBy: { $nin: [userObjectId] },

      ...(types && {
        "content.type": Array.isArray(types) ? { $in: types } : types,
        viewType: { $ne: VIEW_TYPE.ONE_TIME_VIEW },
      }),
      $or: [
        // Condition 1: If message is "info" type, receiverId must match userId
        {
          $and: [
            { type: "info" },
            {
              $or: [{ receiverId: userId }, { senderId: userId }],
            },
          ],
        },

        // Condition 2: All other message types
        { type: { $ne: "info" } },
      ],
      ...(types && {
        "content.type": Array.isArray(types) ? { $in: types } : types,
      }),
      ...(messageFilterId && {
        _id: {
          $gt: mongoose.Types.ObjectId.createFromHexString(messageFilterId),
        },
      }),
      ...(nextCursor && {
        _id: { $lt: mongoose.Types.ObjectId.createFromHexString(nextCursor) },
      }),
    };

    if (isBlocked) {
      const blockedMember = await blockedMembersService.findOne({
        groupId,
        blockedId: userId,
      });

      if (blockedMember.ex) throw blockedMember.ex;
      if (blockedMember.data) {
        filter.createdAt = { $lt: blockedMember.data.createdAt };
      }
    }

    const groupMessages = await GroupMessage.aggregate([
      { $match: filter },
      { $sort: { _id: -1 } },
      { $limit: +limit },

      // 👇 check if current user has opened this one-time message
      {
        $lookup: {
          from: "group-message-open-statuses",
          let: { msgId: "$_id", userId: userObjectId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$messageId", "$$msgId"] },
                    {
                      $gt: [
                        {
                          $size: {
                            $filter: {
                              input: "$openedBy",
                              as: "o",
                              cond: { $eq: ["$$o.userId", "$$userId"] },
                            },
                          },
                        },
                        0,
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: "opened",
        },
      },
      // { $unwind: { path: "$opened", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          viewStatus: {
            $cond: [
              { $eq: ["$viewType", "standard"] },
              null,
              {
                $cond: [
                  { $eq: ["$sender", userObjectId] }, // if sender == userId
                  "$viewStatus", // keep original field
                  {
                    $cond: [
                      { $gt: [{ $size: "$opened" }, 0] },
                      "opened",
                      "unopened",
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
      { $project: { opened: 0 } },

      // 👇 sender populate
      {
        $lookup: {
          from: "users",
          localField: "sender",
          foreignField: "_id",
          as: "sender",
          pipeline: [
            { $project: { displayName: 1, walletAddress: 1, profileImage: 1 } },
          ],
        },
      },
      { $unwind: "$sender" },

      // 👇 replyTo populate
      {
        $lookup: {
          from: "group-messages",
          localField: "replyTo",
          foreignField: "_id",
          as: "replyTo",
          pipeline: [
            { $project: { content: 1, sender: 1, viewType: 1, viewStatus: 1 } },
            {
              $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "_id",
                as: "sender",
                pipeline: [{ $project: { userName: 1, profileImage: 1 } }],
              },
            },
            { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } },
          ],
        },
      },
      { $unwind: { path: "$replyTo", preserveNullAndEmptyArrays: true } },

      // 👇 reactedBy.userId populate
      {
        $lookup: {
          from: "users",
          localField: "reactedBy.userId",
          foreignField: "_id",
          as: "reactedByUsers",
          pipeline: [{ $project: { userName: 1, profileImage: 1 } }],
        },
      },
    ]);

    result.data = {
      groupMessages,
      nextCursor: groupMessages[groupMessages.length - 1]?._id
        ? groupMessages[groupMessages.length - 1]?._id
        : null,
      hasNextPage: groupMessages.length === limit,
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.deleteMessage = async (deleteMessagesDto, result = {}) => {
  try {
    const { messageId, deleteType, userId } = deleteMessagesDto;

    const message = await GroupMessage.findByIdAndUpdate(
      messageId,
      {
        ...(deleteType == DELETE_TYPE.DELETE_FOR_ME
          ? {
              $addToSet: {
                deletedFor: userId,
              },
            }
          : { isDeletedForEveryone: true, isPinned: false }),
      },
      { new: true }
    );
    if (!message) {
      result.messageNotFound = true;
    } else {
      if (deleteType === DELETE_TYPE.DELETE_FOR_EVERYONE) {
        if (message.isPinned) {
          await pinnedMessagesService.findOneAndUpdate(
            { groupId: message.groupId },
            {
              $pull: { pinnedMessages: { messageId: message._id } },
            }
          );
        }
        await GroupsQueue.add(
          {
            message,
            sendPushNotification: false,
            eventType: TOPIC_NAMES.DELETE_GROUP_MESSAGE,
            emitId: message.groupId.toString(),
          },
          {
            jobId: `group_message_${message._id}_6`,
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
    const { messageIds, deleteType, userId, groupId } = deleteMessagesDto;

    const messages = await GroupMessage.updateMany(
      { _id: { $in: messageIds } },
      {
        ...(deleteType == DELETE_TYPE.DELETE_FOR_ME
          ? {
              $addToSet: {
                deletedFor: userId,
              },
            }
          : {
              isDeletedForEveryone: true,
              isPinned: false,
            }),
      },
      { new: true }
    );

    if (messages) {
      const updated = await GroupMessage.find({
        _id: { $in: messageIds },
      })
        .populate("sender", "userName profileImage")
        .lean();
      if (deleteType === DELETE_TYPE.DELETE_FOR_EVERYONE) {
        await pinnedMessagesService.findOneAndUpdate(
          { groupId },
          {
            $pull: { pinnedMessages: { messageId: { $in: messageIds } } },
          }
        );

        await GroupsQueue.add(
          {
            message: updated,
            sendPushNotification: false,
            eventType: TOPIC_NAMES.DELETE_MULTIPLE_GROUP_MESSAGES,
            emitId: groupId.toString(),
          },
          {
            jobId: `group_message_${updated[0]._id}_3`,
            removeOnComplete: true,
            attempts: 5,
            backoff: { type: "exponential", delay: 10000 },
          }
        );
      }
      result.data = updated;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.deleteMany = async ({ groupId }, result = {}) => {
  try {
    result.data = await GroupMessage.deleteMany({ groupId });
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getLastMessage = async (groupId, result = {}) => {
  try {
    const groupMessage = await GroupMessage.findOne({ groupId })
      .sort({ _id: -1 })
      .limit(1);

    if (!groupMessage) {
      result.groupMessageNotFound = true;
    } else {
      result.data = groupMessage;
    }
  } catch (ex) {
    console.log(ex);
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
      GroupMessage.countDocuments(filter),
      GroupMessage.aggregate([
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

exports.pinMessage = async (getDatasDto, result = {}) => {
  try {
    const { messageId, userId, duration, groupId } = getDatasDto;

    let expiresAt = new Date();
    const now = new Date();

    switch (duration) {
      case "24 hours":
        expiresAt.setHours(expiresAt.getHours() + 24);
        break;
      case "7 days":
        expiresAt.setDate(expiresAt.getDate() + 7);
        break;
      case "30 days":
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        break;
    }

    const pinnedMessageResp = await pinnedMessagesService.findOne({
      groupId,
    });
    if (pinnedMessageResp.ex) throw pinnedMessageResp.ex;

    if (pinnedMessageResp.data) {
      const pinnedMessages = pinnedMessageResp.data.pinnedMessages;
      const isPinned = pinnedMessages.some(
        (entry) => entry.messageId.toString() === messageId
      );

      const updatedArray = isPinned
        ? pinnedMessages.filter(
            (p) => p.messageId.toString() !== messageId.toString()
          )
        : [
            ...pinnedMessages,
            {
              messageId: mongoose.Types.ObjectId.createFromHexString(messageId),
              pinnedBy: userId,
              pinnedAt: now,
              expiresAt,
              duration,
            },
          ];

      if (updatedArray.length > 3) {
        const messageId = updatedArray[0].messageId;
        await GroupMessage.findByIdAndUpdate(messageId, {
          isPinned: false,
        });
        updatedArray.shift();
      }

      const [updatedPinnedMessage, updatedMesssage] = await Promise.all([
        pinnedMessagesService.findByIdAndUpdate(pinnedMessageResp.data._id, {
          pinnedMessages: updatedArray,
        }),
        GroupMessage.findByIdAndUpdate(messageId, {
          isPinned: !isPinned,
        }),
      ]);

      if (updatedPinnedMessage.ex) throw updatedPinnedMessage.ex;
      if (updatedMesssage.ex) throw updatedMesssage.ex;
    } else {
      const [updatedPinnedMessage, updatedMesssage] = await Promise.all([
        pinnedMessagesService.create({
          groupId,
          pinnedMessages: [
            {
              messageId,
              pinnedBy: userId,
              pinnedAt: now,
              expiresAt,
              duration,
            },
          ],
        }),
        GroupMessage.findByIdAndUpdate(
          messageId,
          {
            isPinned: true,
          },
          { new: true }
        ),
      ]);
    }
    const populatedMessage = await pinnedMessagesService.findOnePopulated({
      groupId,
      userId,
    });
    if (populatedMessage.ex) throw populatedMessage.ex;

    await GroupsQueue.add(
      {
        message: populatedMessage,
        sendPushNotification: false,
        eventType: TOPIC_NAMES.PIN_GROUP_MESSAGE,
        emitId: groupId.toString(),
      },
      {
        jobId: `group_message_${message._id}_3`,
        removeOnComplete: true,
        attempts: 5,
        backoff: { type: "exponential", delay: 10000 },
      }
    );

    result.data = populatedMessage.data;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.updateMany = async (findsDto, updatesDto, result = {}) => {
  try {
    result.data = await GroupMessage.updateMany(findsDto, updatesDto, {
      new: true,
    });
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.undoDeleteMessages = async (deleteMessagesDto, result = {}) => {
  try {
    const { messageIds, deleteType, userId, groupId } = deleteMessagesDto;

    const messages = await GroupMessage.updateMany(
      { _id: { $in: messageIds } },
      {
        ...(deleteType == DELETE_TYPE.DELETE_FOR_ME
          ? {
              $pull: {
                deletedFor: userId,
              },
            }
          : {
              isDeletedForEveryone: false,
            }),
      },
      { new: true }
    );

    if (messages) {
      const updated = await GroupMessage.find({
        _id: { $in: messageIds },
      })
        .populate("sender", "userName profileImage")
        .populate({
          path: "replyTo",
          select: "content sender viewType viewStatus",
          populate: {
            path: "sender",
            select: "userName profileImage",
          },
        })
        .populate({
          path: "reactedBy.userId",
          select: "userName profileImage", // only get these fields
        })
        .lean();
      if (deleteType === DELETE_TYPE.DELETE_FOR_EVERYONE) {
        await GroupsQueue.add(
          {
            message: updated,
            sendPushNotification: false,
            eventType: TOPIC_NAMES.UNDO_DELETE_MULTIPLE_GROUP_MESSAGES,
            emitId: groupId.toString(),
          },
          {
            jobId: `group_message_${updated[0]._id}_4s`,
            removeOnComplete: true,
            attempts: 5,
            backoff: { type: "exponential", delay: 10000 },
          }
        );
      }
      result.data = updated;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
