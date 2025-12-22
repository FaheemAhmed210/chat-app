const Collection = require("./collections.model");
const mongoose = require("mongoose");
const CONSTANTS = require("../common/constants/constants");

exports.create = async (createCollectionsDto, result = {}) => {
  try {
    result.data = await Collection.create(createCollectionsDto);
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

exports.findOneAndUpdate = async (findsDto, updatesDto, result = {}) => {
  try {
    const { unreadMessageCount } = updatesDto;
    const updatedCollection = await Collection.findOneAndUpdate(
      findsDto,
      {
        $set: { ...updatesDto },
        ...(unreadMessageCount && {
          $inc: { unreadCount: unreadMessageCount },
        }),
      },

      {
        new: true,
      }
    );

    if (!updatedCollection) {
      const createdCollection = await Collection.create({
        ...findsDto,
        ...updatesDto,
        ...(unreadMessageCount && {
          unreadCount: unreadMessageCount,
        }),
      });
      result.data = createdCollection;
    } else {
      result.data = updatedCollection;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.updateMany = async (findsDto, updatesDto, result = {}) => {
  try {
    const updatedCollections = Collection.updateMany(findsDto, updatesDto);

    result.data = updatedCollections;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.listCollections = async (listCollectionsDto, result = {}) => {
  try {
    const { offset, limit, userId, search } = listCollectionsDto;
    const userObjectId = mongoose.Types.ObjectId.createFromHexString(userId);
    const filter = {
      userId: userObjectId,
      ...(search && { collectionName: { $regex: search, $options: "i" } }),
      isBlocked: false,
      isDeleted: false, // exclude chats deleted by this user
    };
    const [collections, count] = await Promise.all([
      Collection.aggregate([
        {
          $match: filter,
        },

        {
          $sort: { lastUpdated: -1 },
        },
        { $skip: (offset - 1) * limit },
        { $limit: +limit },
        {
          $lookup: {
            from: "users",
            let: { id: "$otherUser" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$_id", "$$id"] }],
                  },
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
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },

        // 1) Run two parallel lookups
        {
          $facet: {
            chatMessage: [
              { $match: { type: "chats" } },
              {
                $lookup: {
                  from: "chat-messages",
                  let: {
                    itemId: "$collectionId",
                    clearedBy: "$clearedMessageId",
                    userId: userObjectId,
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ["$chatId", "$$itemId"] },
                            { $eq: ["$isDeletedForEveryone", false] },
                            {
                              $not: {
                                $in: [
                                  "$$userId",
                                  { $ifNull: ["$deletedFor", []] },
                                ],
                              },
                            },
                            {
                              $or: [
                                { $eq: ["$$clearedBy", null] },
                                { $gt: ["$_id", "$$clearedBy"] },
                              ],
                            },
                          ],
                        },
                      },
                    },
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 },
                  ],
                  as: "lastMessage",
                },
              },
            ],
            groupMessage: [
              { $match: { type: "groups" } },
              {
                $lookup: {
                  from: "group-messages",
                  let: {
                    groupId: "$collectionId",
                    clearedBy: "$clearedMessageId",
                    userId: userObjectId,
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ["$groupId", "$$groupId"] },
                            {
                              $not: {
                                $in: [
                                  userObjectId,
                                  { $ifNull: ["$deletedFor", []] },
                                ],
                              },
                            },
                            { $eq: ["$isDeletedForEveryone", false] },
                            {
                              $not: {
                                $in: ["$content.type", ["request", "payment"]],
                              },
                            },
                            {
                              $or: [
                                { $not: ["$$clearedBy"] }, // not cleared
                                { $gt: ["$_id", "$$clearedBy"] }, // cleared → only newer
                              ],
                            },
                          ],
                        },
                      },
                    },
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 },
                  ],
                  as: "lastMessage",
                },
              },
            ],
            channelMessage: [
              { $match: { type: "channels" } },
              {
                $lookup: {
                  from: "channel-messages",
                  let: {
                    channelId: "$collectionId",
                    clearedBy: "$clearedMessageId",
                    userId: userObjectId,
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ["$channelId", "$$channelId"] },
                            {
                              $not: {
                                $in: [
                                  userObjectId,
                                  { $ifNull: ["$deletedFor", []] },
                                ],
                              },
                            },
                            { $eq: ["$isDeletedForEveryone", false] },
                            {
                              $or: [
                                { $not: ["$$clearedBy"] }, // not cleared
                                { $gt: ["$_id", "$$clearedBy"] }, // cleared → only newer
                              ],
                            },
                            {
                              $or: [
                                { $ne: ["$content.type", "request"] }, // not a request → always allow
                                {
                                  $and: [
                                    { $eq: ["$content.type", "request"] },
                                    {
                                      $in: [
                                        userObjectId,
                                        [
                                          "$content.metaData.sender",
                                          "$content.metaData.reciver",
                                        ],
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      },
                    },
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 },
                  ],
                  as: "lastMessage",
                },
              },
            ],
          },
        },

        // // 2) Merge chat + group results into one document
        {
          $project: {
            combined: {
              $concatArrays: [
                "$chatMessage",
                "$groupMessage",
                "$channelMessage",
              ],
            },
          },
        },

        // 3) Unwind final array so you get a single object
        { $unwind: "$combined" },

        // 4) Replace root with that object
        { $replaceRoot: { newRoot: "$combined" } },
      ]),
      Collection.countDocuments(filter),
    ]);

    result.data = {
      collections,
      pages: Math.ceil(count / +limit),
      count,
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findOne = async (findsDto, result = {}) => {
  try {
    const collection = await Collection.findOne(findsDto);

    if (!collection) {
      result.collectionNotFound = true;
    } else {
      result.data = collection;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findOneAndDelete = async (findOneAndDeletesDto, result = {}) => {
  try {
    const collection = await Collection.findOneAndDelete(findOneAndDeletesDto);

    if (collection) {
      result.data = collection;
    } else {
      result.collectionNotFound = true;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.deleteMany = async (deletesDto, result = {}) => {
  try {
    result.data = await Collection.deleteMany(deletesDto);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
