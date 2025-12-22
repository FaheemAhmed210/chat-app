const PinnedMessage = require("./pinned-messages.model");
const groupsService = require("../groups.service");

exports.create = async (createsDto, result = {}) => {
  try {
    const messageStatus = await PinnedMessage.create(createsDto);

    result.data = messageStatus;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findOne = async (findsDto, result = {}) => {
  try {
    const messageStatus = await PinnedMessage.findOne(findsDto);

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

exports.find = async (findsDto, result = {}) => {
  try {
    result.data = await PinnedMessage.find(findsDto);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findOnePopulated = async (findsDto, result = {}) => {
  try {
    const { groupId, userId } = findsDto;
    const [pinnedMessage, groupsResp] = await Promise.all([
      PinnedMessage.findOne({
        groupId,
      }).populate({
        path: "pinnedMessages.messageId",
        select: "content sender deletedFor",
        populate: {
          path: "sender",
          select: "userName profileImage",
        },
      }),
      groupsService.findById(groupId),
    ]);

    if (!pinnedMessage) {
      result.messageStatusNotFound = true;
    } else {
      const clearedEntry = (groupsResp?.data?.clearedBy || []).find(
        (entry) => entry?.userId?.toString() === userId?.toString()
      );

      const messageFilterId = clearedEntry?.messageId;

      if (!pinnedMessage) return null;

      const filteredPinnedMessages = pinnedMessage.pinnedMessages.filter(
        (p) => {
          const deletedFor = p.messageId?.deletedFor || [];
          // Exclude if message was sent before user's cleared message

          const isDeletedForUser = deletedFor.some(
            (id) => id?.toString() === userId?.toString()
          );

          const isBeforeCleared =
            messageFilterId &&
            p.messageId._id &&
            p.messageId._id.toString() <= messageFilterId.toString();

          return !isDeletedForUser && !isBeforeCleared;
        }
      );

      result.data = {
        ...pinnedMessage.toObject(),
        pinnedMessages: filteredPinnedMessages,
      };
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findOneAndUpdate = async (findsDto, updatesDto, result = {}) => {
  try {
    const updatedPinnedMessage = await PinnedMessage.findOneAndUpdate(
      findsDto,
      updatesDto,
      {
        new: true,
      }
    );

    result.data = updatedPinnedMessage;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findByIdAndUpdate = async (pinMessageId, updatesDto, result = {}) => {
  try {
    const updatedMessageStatus = await PinnedMessage.findByIdAndUpdate(
      pinMessageId,

      { $set: updatesDto },
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

exports.updateMany = async (findsDto, updatesDto, result = {}) => {
  try {
    const updatedPinnedMessage = await PinnedMessage.updateMany(
      findsDto,
      updatesDto,
      {
        new: true,
      }
    );

    result.data = updatedPinnedMessage;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
