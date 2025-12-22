const User = require("./users.model");
const CONSTANTS = require("../common/constants/constants");
const redisClient = require("../../helpers/redis");
// const userGiftsService = require("../gifts/user-gifts/user-gifts.service");
const groupsService = require("../groups/groups.service");

const mongoose = require("mongoose");
const { GROUP_TYPES } = require("../groups/constants/groups.constants");
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
    const user = await User.findOne(findsDto);

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

exports.getUserCount = async (countDocumentsDto, result = {}) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayUserCount = await User.countDocuments({
      createdAt: {
        $gte: startOfToday,
      },
    });

    const totalUsers = await User.countDocuments({});

    result.data = {
      userCount: todayUserCount ? todayUserCount : 0,
      totalUsers,
    };
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

exports.findUserById = async (userId, result = {}) => {
  try {
    const user = await User.findById(userId).select({
      _id: 1,
      userName: 1,
      profileImage: 1,
      displayName: 1,
      walletAddress: 1,
      btcWalletAddress: 1,
      solanaWalletAddress: 1,
      tronWalletAddress: 1,
    });
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

exports.getWaitingListData = async (getWaitingListDatasDto, result = {}) => {
  try {
    const { userId } = getWaitingListDatasDto;
    const [totalCount, waitlistUsers] = await Promise.all([
      User.countDocuments({ waitingList: true }),
      User.find({ waitingList: true })
        .sort({ createdAt: 1 }) // oldest first
        .select("_id"),
    ]);

    const position =
      waitlistUsers.findIndex((u) => u._id.toString() === userId.toString()) +
      1;

    result.data = {
      totalCount: totalCount + 1000,
      position: position + 1000,
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getWaitingListPositions = async (result = {}) => {
  try {
    const waitlistUsers = await User.aggregate([
      {
        $match: { waitingList: true },
      },
      {
        $setWindowFields: {
          sortBy: { createdAt: 1 },
          output: {
            position: {
              $documentNumber: {},
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          position: { $add: ["$position", 1000] },
        },
      },
    ]);

    result.data = waitlistUsers;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getUserRefferals = async (findAndCountsDto, result = {}) => {
  try {
    const { offset, limit, userId, search } = findAndCountsDto;

    const filter = {
      "referralTree.level1": userId,
      ...(search && { userName: { $regex: search, $options: "i" } }),
    };

    const users = await User.find(filter)
      .limit(+limit)
      .skip((offset - 1) * +limit);

    result.data = users;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.checkUdid = async (checkUdidsDto, result = {}) => {
  try {
    const { udid } = checkUdidsDto;

    const userCount = await User.countDocuments({ udid });

    const user = await User.findOne({
      udid,
      ...(userCount > 1 && { userName: { $exists: true } }),
    }).select({
      userName: 1,
      profileImage: 1,
      walletAddress: 1,
      displayName: 1,
    });

    if (!user) {
      result.userNotFound = true;
    } else {
      const userId = user._id;
      const [totalCount, waitlistUsers] = await Promise.all([
        User.countDocuments({ waitingList: true }),
        User.find({ waitingList: true })
          .sort({ createdAt: 1 }) // oldest first
          .select("_id"),
      ]);

      const position =
        waitlistUsers.findIndex((u) => u._id.toString() === userId.toString()) +
        1;

      result.data = {
        user,
        waitingList: user.waitingList,
        totalCount: totalCount + 1000,
        position: user.waitingList ? position + 1000 : 0,
      };
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.deleteUser = async (deleteUsersDto, result = {}) => {
  try {
    const { walletAddress, udid } = deleteUsersDto;

    if (walletAddress) {
      const user = await User.findOneAndDelete({
        walletAddress: walletAddress.toLowerCase(),
      });
      result.data = user;
    } else if (udid) {
      const user = await User.deleteMany({
        udid,
      });
      result.data = user;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getOnlineStatus = async (getOnlineStatusDto, result = {}) => {
  try {
    const { userId } = getOnlineStatusDto;
    const isOnline = await redisClient.get(`online:${userId}`);

    const lastSeen = await redisClient.get(`lastSeen:${userId}`);

    result.data = {
      ...(isOnline === "1"
        ? { online: true, lastSeen: null }
        : {
            online: false,
            lastSeen: lastSeen
              ? new Date(Number(lastSeen)).toISOString()
              : null,
          }),
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getUserProfile = async (userId, result = {}) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      result.userNotFound = true;
    } else {
      const { data: gifts } = await userGiftsService.getUserGifts(userId);
      result.data = { user, gifts };
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getAllUserIds = async (result = {}) => {
  try {
    result.data = await User.find({
      userName: { $exists: true },
      isBlocked: false,
      waitingList: false,
    }).select({ _id: 1 });
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
      User.countDocuments(filter),
      User.aggregate([
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

exports.searchUsers = async (searchUsersDto, result = {}) => {
  try {
    const { offset, limit, userId, search } = searchUsersDto;

    const filter = {
      _id: { $ne: userId },
      userName: { $regex: search, $options: "i" },
    };

    const userObjectId = mongoose.Types.ObjectId.createFromHexString(userId);
    const users = await User.aggregate([
      {
        $match: filter,
      },
      {
        $addFields: {
          name: { $ifNull: ["$userName", ""] },
          type: "user",
        },
      },

      {
        $unionWith: {
          coll: "groups",
          pipeline: [
            {
              $match: {
                name: { $regex: search, $options: "i" },
                groupsType: { $ne: GROUP_TYPES.PRIVATE },
                isSuperGroup: false,
              },
            },
            // lookup comments for count
            {
              $lookup: {
                from: "group-participants",
                let: { groupId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$groupId", "$$groupId"] },
                      userId: userObjectId,
                    },
                  },
                  {
                    $project: {
                      _id: 0,
                      isApproved: 1, // only bring necessary field
                      subscription: 1, // only bring necessary field
                    },
                  },
                  {
                    $addFields: {
                      isMember: true,
                    },
                  },
                ],
                as: "user",
              },
            },

            // Step 2: Add commentCount
            {
              $unwind: {
                path: "$user",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "users",
                let: { ownerId: "$owner" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$_id", "$$ownerId"] },
                    },
                  },
                  {
                    $project: {
                      userName: 1,
                      profileImage: 1,
                      displayName: 1,
                      walletAddress: 1,
                      btcWalletAddress: 1,
                      solanaWalletAddress: 1,
                      tronWalletAddress: 1,
                    },
                  },
                ],
                as: "owner",
              },
            },
            { $unwind: "$owner" },
            {
              $addFields: {
                type: "group",
              },
            },
          ],
        },
      },

      {
        $addFields: {
          relevance: {
            $switch: {
              branches: [
                { case: { $eq: ["$name", search] }, then: 0 }, // exact match
                {
                  case: {
                    $regexMatch: {
                      input: "$name",
                      regex: `^${search}`,
                      options: "i",
                    },
                  },
                  then: 1,
                }, // starts with search
                {
                  case: {
                    $regexMatch: {
                      input: "$name",
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
      },
      {
        $addFields: {
          sortCategory: {
            $switch: {
              branches: [
                {
                  case: {
                    $regexMatch: { input: "$name", regex: /^[A-Za-z]/ },
                  },
                  then: 0,
                }, // letters
                {
                  case: {
                    $regexMatch: { input: "$name", regex: /^[0-9]/ },
                  },
                  then: 1,
                }, // numbers
              ],
              default: 2, // special chars
            },
          },
        },
      },
      {
        $sort: {
          relevance: 1,
          sortCategory: 1, // false (letters) first, true (numbers) last
          name: 1,
        },
      },
      { $skip: (offset - 1) * +limit },
      { $limit: +limit },
    ]);

    result.data = users;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findAndCountAll = async (findAndCountsDto, result = {}) => {
  try {
    const { offset, limit, userId, search, isBlocked } = findAndCountsDto;

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

    const [users, groupsResp] = await Promise.all([
      User.aggregate(pipeline),
      groupsService.getAllGroupsWithSearch(findAndCountsDto),
    ]);

    result.data = {
      users,
      groups: groupsResp?.data,
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
