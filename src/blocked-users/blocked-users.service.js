const BlockedUser = require("./blocked-users.model");
const CONSTANTS = require("../common/constants/constants");

exports.create = async (createBlockedUsersDto, result = {}) => {
  try {
    const { isBlocked, blockerId, blockedId } = createBlockedUsersDto;

    result.data = isBlocked
      ? await BlockedUser.create({ blockerId, blockedId })
      : await BlockedUser.findOneAndDelete({ blockerId, blockedId });
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
    const user = await BlockedUser.findOne(findsDto);

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

exports.getBlockedIds = async (userId, result = {}) => {
  try {
    result.data = await BlockedUser.find({ blockerId: userId }).distinct(
      "blockedId"
    );
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
