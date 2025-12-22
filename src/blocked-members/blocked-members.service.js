const BlockedMember = require("./blocked-members.model");
const CONSTANTS = require("../common/constants/constants");

exports.create = async (createBlockedMemberssDto, result = {}) => {
  try {
    const { isBlocked, groupId, channelId, blockedId } =
      createBlockedMemberssDto;

    const data = {
      groupId: groupId || null,
      channelId: channelId || null,
      blockedId,
    };

    result.data = isBlocked
      ? await BlockedMember.create(data)
      : await BlockedMember.findOneAndDelete(data);
  } catch (ex) {
    if (
      ex.name === CONSTANTS.DATABASE_ERROR_NAMES.MONGO_SERVER_ERROR &&
      ex.code === CONSTANTS.DATABASE_ERROR_CODES.UNIQUE_VIOLATION
    ) {
      const uniqueViolaterMessage = ex.message.split("{ ")[1];
      const uniqueViolaterField = uniqueViolaterMessage.split(":")[0];
      result.conflictMessage = `${uniqueViolaterField} already exist`;
      result.conflictField = uniqueViolaterField;
      result.hasConflict = true;
    } else {
      result.ex = ex;
    }
  } finally {
    return result;
  }
};

exports.findOne = async (findsDto, result = {}) => {
  try {
    const user = await BlockedMember.findOne(findsDto);

    if (!user) {
      result.userNotFound = true;
    } else {
      result.data = user;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
