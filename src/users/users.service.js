const User = require("./users.model");
const CONSTANTS = require("../common/constants/constants");
const mongoose = require("mongoose");

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
    const user = await User.countDocuments(countDocumentsDto);

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

exports.findById = async (userId, result = {}) => {
  try {
    const user = await User.findById(userId);

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

exports.findByIdAndUpdate = async (userId, updatesDto, result = {}) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,

      { $set: { ...updatesDto } },
      {
        new: true,
      }
    );

    result.data = updatedUser;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findAndCount = async (findAndCountsDto, result = {}) => {
  try {
    const { offset, limit, userId, search, groupId, isBlocked } =
      findAndCountsDto;

    const blocked = Boolean(isBlocked ?? false);

    const filter = {
      _id: { $ne: userId },
      userName: { $exists: true },
      ...(search && { userName: { $regex: search, $options: "i" } }),
    };

    const pipeline = [
      {
        $match: filter,
      },
      {
        $lookup: {
          from: "blocked-users",
          let: {
            currentUser: mongoose.Types.ObjectId.createFromHexString(userId),
            otherUser: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$blockerId", "$$currentUser"] },
                    { $eq: ["$blockedId", "$$otherUser"] },
                  ],
                },
              },
            },
          ],
          as: "blockedInfo",
        },
      },
      {
        $addFields: {
          isBlocked: { $gt: [{ $size: "$blockedInfo" }, 0] },
        },
      },
    ];

    // 🔹 Apply filter based on `blocked`
    if (blocked === true) {
      pipeline.push({ $match: { isBlocked: true } });
    } else if (blocked === false) {
      pipeline.push({ $match: { isBlocked: false } });
    }

    if (groupId) {
      const groupObjId = mongoose.Types.ObjectId.createFromHexString(groupId);
      pipeline.push(
        {
          $lookup: {
            from: "group-participants", // collection name in Mongo
            localField: "_id",
            foreignField: "userId",
            as: "participant",
            pipeline: [{ $match: { groupId: groupObjId } }],
          },
        },
        { $match: { participant: { $size: 0 } } }
      );
    }

    // 🔹 Refined relevance scoring if search is provided
    if (search) {
      pipeline.push({
        $addFields: {
          relevance: {
            $switch: {
              branches: [
                { case: { $eq: ["$userName", search] }, then: 0 }, // exact match
                {
                  case: {
                    $regexMatch: {
                      input: "$userName",
                      regex: `^${search}`,
                      options: "i",
                    },
                  },
                  then: 1,
                }, // starts with search
                {
                  case: {
                    $regexMatch: {
                      input: "$userName",
                      regex: search,
                      options: "i",
                    },
                  },
                  then: 2,
                }, // contains search
              ],
              default: 3,
            },
          },
        },
      });
    }

    pipeline.push({
      $addFields: {
        sortCategory: {
          $switch: {
            branches: [
              {
                case: {
                  $regexMatch: { input: "$userName", regex: /^[A-Za-z]/ },
                },
                then: 0,
              }, // letters
              {
                case: { $regexMatch: { input: "$userName", regex: /^[0-9]/ } },
                then: 1,
              }, // numbers
            ],
            default: 2, // special chars
          },
        },
      },
    });

    pipeline.push({
      $sort: {
        ...(search ? { relevance: 1 } : {}),
        sortCategory: 1, // false (letters) first, true (numbers) last
        userName: 1,
      },
    });
    pipeline.push({ $skip: (offset - 1) * +limit });
    pipeline.push({ $limit: +limit });

    const users = await User.aggregate(pipeline);

    result.data = users;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findAll = async (findAllsDto, result = {}) => {
  try {
    const users = await User.find(findAllsDto);

    result.data = users;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
