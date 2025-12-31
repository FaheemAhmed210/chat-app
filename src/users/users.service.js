const User = require("./users.model");
const CONSTANTS = require("../common/constants/constants");

exports.create = async (createUsersDto, result = {}) => {
  try {
    const user = await User.create(createUsersDto);

    result.data = user;
  } catch (ex) {
    if (
      ex.name === CONSTANTS.DATABASE_ERROR_NAMES.MONGO_SERVER_ERROR &&
      ex.code === CONSTANTS.DATABASE_ERROR_CODES.UNIQUE_VIOLATION
    ) {
      const uniqueViolaterMessage = ex.message.split("{ ")[1];
      const uniqueViolaterField = uniqueViolaterMessage.split(":")[0];
      result.conflictMessage = `${uniqueViolaterField} already exists`;
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
    const user = await User.findOne(findsDto);

    if (!user) {
      result.notFound = true;
    } else {
      result.data = user;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.countDocuments = async (countDocumentsDto, result = {}) => {
  try {
    result.data = await User.countDocuments(countDocumentsDto);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findById = async (userId, result = {}) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      result = { notFound: true, exMessage: "User Not Found" };
    } else {
      result.data = user;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findByIdAndUpdate = async (userId, updatesDto, result = {}) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,

      { $set: { ...updatesDto } },
      {
        new: true,
      }
    );

    if (!updatedUser) {
      result = { notFound: true, exMessage: "User Not Found" };
    } else {
      result.data = updatedUser;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
