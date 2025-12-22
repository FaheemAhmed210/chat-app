const MessageStatus = require("./messages-open-status.model");
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
    const { groupId, userId, messageId } = updatesDto;

    const updatedMessageStatus = await MessageStatus.findOneAndUpdate(
      {
        groupId, // must be provided
        messageId, // all older messages
        "openedBy.userId": { $ne: userId }, // user not already in seenBy
      },
      {
        $addToSet: {
          openedBy: { userId, openedAt: new Date() },
        },
      },
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

exports.deleteMany = async ({ groupId }, result = {}) => {
  try {
    result.data = await MessageStatus.deleteMany({ groupId });
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
