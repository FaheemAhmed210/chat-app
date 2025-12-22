const MessageStatus = require("./messages-status.model");
const mongoose = require("mongoose");
const { UPATE_MESSAGE_STATUS } = require("../constants/groups.constants");

exports.create = async (createsDto, result = {}) => {
  try {
    const messageStatus = await MessageStatus.create(createsDto);

    result.data = messageStatus;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findOne = async (findsDto, result = {}) => {
  try {
    const messageStatus = await MessageStatus.findOne(findsDto);

    if (!messageStatus) {
      result.messageStatusNotFound = true;
    } else {
      result.data = messageStatus;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.deleteMany = async (deletesDto, result = {}) => {
  try {
    result.data = await MessageStatus.deleteMany(deletesDto);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findById = async (messageStatusId, result = {}) => {
  try {
    const messageStatus = await MessageStatus.findById(messageStatusId);

    if (!messageStatus) {
      result.messageStatusNotFound = true;
    } else {
      result.data = messageStatus;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findByIdAndUpdate = async (
  messageStatusId,
  updatesDto,
  result = {}
) => {
  try {
    const updatedMessageStatus = await MessageStatus.findByIdAndUpdate(
      messageStatusId,

      { $set: { ...updatesDto } },
      {
        new: true,
      }
    );

    result.data = updatedMessageStatus;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findAndCount = async (findAndCountsDto, result = {}) => {
  try {
    const { offset, limit } = findAndCountsDto;

    const filter = {};

    const messageStatuss = await MessageStatus.find(filter)
      .limit(+limit)
      .skip((offset - 1) * +limit);

    result.data = messageStatuss;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findOneAndUpdate = async (findsDto, updatesDto, result = {}) => {
  try {
    const updatedMessageStatus = await MessageStatus.findOneAndUpdate(
      findsDto,

      { $set: { ...updatesDto } },
      {
        new: true,
      }
    );

    result.data = updatedMessageStatus;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.updateMessageStatus = async (updatesDto, result = {}) => {
  try {
    const { status, groupId, userId, messageId } = updatesDto;

    const messageObjId = mongoose.Types.ObjectId.createFromHexString(messageId);

    if (UPATE_MESSAGE_STATUS.READ === status) {
      const updatedMessageStatus = await MessageStatus.updateMany(
        {
          groupId, // must be provided
          messageId: { $lte: messageId }, // all older messages
          "seenBy.userId": { $ne: userId }, // user not already in seenBy
        },
        {
          $addToSet: {
            seenBy: { userId, seenAt: new Date() },
          },
          $inc: { seenCount: 1 },
        }
      );

      result.data = updatedMessageStatus;
    } else if (UPATE_MESSAGE_STATUS.DELIVERED === status) {
      const updatedMessageStatus = await MessageStatus.updateMany(
        {
          groupId, // must be provided
          messageId: { $lte: messageId }, // all older messages
          "deliveredTo.userId": { $ne: userId }, // user not already in deliveredTo
        },
        {
          $addToSet: {
            deliveredTo: { userId, deliveredAt: new Date() },
          },
          $inc: { deliveredCount: 1 },
        }
      );

      result.data = updatedMessageStatus;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getSeenAndDeliveredMessageIds = async (groupId, result = {}) => {
  try {
    const [seenMessages, deliveredMessages] = await Promise.all([
      MessageStatus.aggregate([
        {
          $match: {
            groupId,
            $expr: { $eq: [{ $size: "$seenBy" }, "$totalCount"] },
          },
        },
        {
          $project: { messageId: 1, _id: 0 }, // only return messageId
        },
      ]),
      MessageStatus.aggregate([
        {
          $match: {
            groupId,
            $expr: { $eq: [{ $size: "$deliveredTo" }, "$totalCount"] },
          },
        },
        {
          $project: { messageId: 1, _id: 0 }, // only return messageId
        },
      ]),
    ]);

    const seenMessageIds = seenMessages.map((m) => m.messageId);
    const deliveredMessageIds = deliveredMessages.map((m) => m.messageId);

    result.data = { seenMessageIds, deliveredMessageIds };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

// exports.deleteMany = async ({ groupId }, result = {}) => {
//   try {
//     result.data = await MessageStatus.deleteMany({ groupId });
//   } catch (ex) {
//     result.ex = ex;
//   } finally {
//     return result;
//   }
// };
