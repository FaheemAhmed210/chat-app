const GroupParticipants = require("./participants.model");
const mongoose = require("mongoose");

const groupsService = require("../groups.service");
const {
  GROUP_TYPES,
  SUBSCRIPTION_STATUS,
} = require("../constants/groups.constants");
const blockedMembersService = require("../../blocked-members/blocked-members.service");
const collectionsService = require("../../collections/collections.service");
const {
  COLLECTION_TYPES,
  PARTICIPANT_TYPES,
} = require("../../collections/constants/collections.constants");
const { toObjectId } = require("../../common/moongoose/to-object-id");

exports.insertMany = async (insertManysDto, result = {}) => {
  try {
    result.data = await GroupParticipants.insertMany(insertManysDto);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.create = async (createsDto, result = {}) => {
  try {
    const { groupId, participants, subscription, blockedMembers } = createsDto;

    const groupParticipants = participants.map((participant) => ({
      groupId,
      ...participant,
      isBlocked: blockedMembers?.includes(participant.userId.toString()),
      ...(subscription && {
        subscription,
      }),
    }));

    const addParticipants = await GroupParticipants.insertMany(
      groupParticipants
    );

    if (addParticipants) {
      result.data = addParticipants;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.createOne = async (createsDto, result = {}) => {
  try {
    const { groupId, userId } = createsDto;

    const blockedResult = await blockedMembersService.findOne({
      blockedId: userId,
      groupId,
    });
    if (blockedResult.ex) throw blockedResult.ex;
    if (blockedResult.data) {
      createsDto.isBlocked = blockedResult?.data ? true : false;
    }

    const addParticipants = await GroupParticipants.create(createsDto);

    if (addParticipants) {
      await Promise.all([
        groupsService.findByIdAndUpdate(groupId, {
          $inc: { groupMembersCount: 1 },
        }),
      ]);

      result.data = addParticipants;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findOne = async (findOnesDto, result = {}) => {
  try {
    const participant = await GroupParticipants.findOne(findOnesDto);

    if (!participant) {
      result.participantNotFound = true;
    } else {
      result.data = participant;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findOneAndDelete = async (findOneAndDeletesDto, result = {}) => {
  try {
    const participant = await GroupParticipants.findOneAndDelete(
      findOneAndDeletesDto
    );

    if (participant) {
      await Promise.all([
        participant.isApproved
          ? groupsService.findByIdAndUpdate(participant.groupId, {
              $inc: { groupMembersCount: -1 },
            })
          : null,
      ]);

      result.data = participant;
    } else {
      result.participantNotFound = true;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.deleteMany = async ({ groupId }, result = {}) => {
  try {
    result.data = await GroupParticipants.deleteMany({ groupId });
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findOneAndUpdate = async (findsDto, updatesDto, result = {}) => {
  try {
    const participant = await GroupParticipants.findOneAndUpdate(
      findsDto,
      updatesDto,
      { new: true }
    );

    if (!participant) {
      result.participantNotFound = true;
    } else {
      result.data = participant;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findByIdAndUpdate = async (participantId, updatesDto, result = {}) => {
  try {
    const participant = await GroupParticipants.findByIdAndUpdate(
      participantId,
      updatesDto,
      { new: true }
    );
    if (!participant) {
      result.participantNotFound = true;
    } else {
      result.data = participant;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.findAndCount = async (findAndCountsDto, result = {}) => {
  try {
    const { limit, offset, groupId, isBlocked } = findAndCountsDto;
    const skip = (offset - 1) * limit;

    const groupsResp = await groupsService.findById(groupId);

    if (groupsResp.ex) throw groupsResp.ex;

    if (groupsResp.groupNotFound) {
      result.groupNotFound = true;
    } else {
      const group = groupsResp.data;

      const filter = {
        groupId,
        isApproved: true,
        ...(group.groupType === GROUP_TYPES.PREMIUM && {
          "subscription.status": SUBSCRIPTION_STATUS.ACTIVE,
        }),
        ...(isBlocked !== undefined && { isBlocked }),
      };

      const [participants, count] = await Promise.all([
        GroupParticipants.find(filter)
          .limit(limit)
          .skip(skip)
          .populate("userId", "userName profileImage"),
        GroupParticipants.countDocuments(filter),
      ]);

      result.data = {
        participants,
        pages: Math.ceil(count / limit),
        count,
      };
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getUserGroups = async (getUserGroupsDto, result = {}) => {
  try {
    const { limit, offset, userId } = getUserGroupsDto;
    const skip = (+offset - 1) * +limit;

    const [groups, count] = await Promise.all([
      GroupParticipants.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            isApproved: true,
          },
        },
        {
          $lookup: {
            from: "groups",
            localField: "groupId",
            foreignField: "_id",
            as: "group",
          },
        },
        { $unwind: "$group" },
        { $replaceRoot: { newRoot: "$group" } },
        { $sort: { lastUpdated: -1 } },
        { $skip: skip },
        { $limit: +limit },
      ]),
      GroupParticipants.countDocuments({ userId, isApproved: true }),
    ]);

    result.data = {
      groups,
      pages: Math.ceil(count / limit),
      count,
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.countDocuments = async (countsDto, result = {}) => {
  try {
    result.data = await GroupParticipants.countDocuments(countsDto);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getGroupUsers = async (getGroupUsersDto, result = {}) => {
  try {
    const { groupId } = getGroupUsersDto;

    const groupParticipants = await GroupParticipants.find({
      groupId,
      isApproved: true,
    }).select({
      _id: 0,
      userId: 1,
      isMuted: 1,
    });

    result.data = groupParticipants;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getUserGroupIds = async (userId, result = {}) => {
  try {
    const groupIds = await GroupParticipants.find({
      userId,
      isApproved: true,
      isBlocked: false,
    }).select({
      _id: 0,
      groupId: 1,
    });

    // Convert to array of group IDs
    if (groupIds.length === 0) {
      result.data = [];
    } else if (groupIds.length === 1) {
      result.data = [groupIds[0].groupId.toString()];
    } else if (groupIds.length > 1) {
      result.data = groupIds.map((g) => g.groupId.toString());
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getGroupCount = async (userId, result = {}) => {
  try {
    result.data = await GroupParticipants.countDocuments({
      userId,
      isApproved: true,
    });
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getPendingGroupCount = async (userId, result = {}) => {
  try {
    result.data = await GroupParticipants.countDocuments({
      userId,
      isApproved: false,
    });
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.approveParticipant = async (approveParticipantsDto, result = {}) => {
  try {
    const { userId, groupId, status } = approveParticipantsDto;

    if (status == "approved") {
      const participant = await GroupParticipants.findOneAndUpdate(
        {
          userId,
          groupId,
        },
        {
          isApproved: true,
        },
        {
          new: true,
        }
      );
      if (participant) {
        const groupResp = await groupsService.findByIdAndUpdate(groupId, {
          $inc: { groupMembersCount: 1 },
        });
        await collectionsService.create({
          userId,
          collectionId: groupResp?.data._id,
          collectionName: groupResp?.data?.name,
          collectionImage: groupResp?.data?.groupImage,
          type: COLLECTION_TYPES.GROUPS,
          participantId: participant._id,
          participantType: PARTICIPANT_TYPES.GROUP_PARTICIPANTS,
          ownerId: groupResp?.data?.owner,
          isApproved: true,
        });
      }

      result.data = participant;
    } else {
      result.data = await GroupParticipants.findOneAndDelete({
        userId,
        groupId,
      });
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getNextOwner = async (groupId, result = {}) => {
  try {
    const nextOwner = await GroupParticipants.findOne({
      groupId,
      isOwner: false,
    })
      .sort([
        ["isAdmin", -1], // admins first
        ["createdAt", 1], // earliest join first
      ])
      .lean();

    result.data = nextOwner;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getPendingGroups = async (pendingGroupsDto, result = {}) => {
  try {
    const { offset, limit, userId } = pendingGroupsDto;

    const userObjectId = mongoose.Types.ObjectId.createFromHexString(userId);

    const filter = {
      userId: userObjectId, // only fetch groups where user is a member
      isApproved: false, // only fetch groups where user is a member
    };
    const [groups, count] = await Promise.all([
      GroupParticipants.aggregate([
        {
          $match: filter,
        },

        {
          $lookup: {
            from: "groups",
            localField: "groupId",
            foreignField: "_id",
            as: "group",
          },
        },
        { $unwind: "$group" },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [
                "$group",
                {
                  isAdmin: "$isAdmin",
                  isOwner: "$isOwner",
                  isApproved: "$isApproved",
                  isMuted: "$isMuted",
                  userSubscription: {
                    $cond: [
                      { $eq: ["$group.groupType", "premium"] },
                      "$subscription",
                      "$$REMOVE", // removes the field when not premium
                    ],
                  },
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "group-messages",
            let: { groupId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$groupId", "$$groupId"] },
                      {
                        $not: {
                          $in: [userObjectId, { $ifNull: ["$deletedFor", []] }],
                        },
                      },
                      { $eq: ["$isDeletedForEveryone", false] },
                    ],
                  },
                },
              },
              { $sort: { createdAt: -1 } }, // newest first
              { $limit: 1 }, // only the latest one
            ],
            as: "lastMessage",
          },
        },
        {
          $unwind: {
            path: "$lastMessage",
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
          $lookup: {
            from: "group-message-statuses",
            let: { groupId: "$_id", uId: userObjectId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$groupId", "$$groupId"] },
                      { $ne: ["$sender", "$$uId"] },
                      {
                        $eq: [
                          {
                            $size: {
                              $filter: {
                                input: "$seenBy",
                                cond: {
                                  $eq: ["$$this.userId", "$$uId"],
                                },
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
              {
                $count: "totalCount",
              },
            ],
            as: "unreadCount",
          },
        },
        {
          $addFields: {
            type: { $literal: "group" },

            unreadCount: {
              $ifNull: [{ $arrayElemAt: ["$unreadCount.totalCount", 0] }, 0],
            },
          },
        },
        {
          $sort: { lastUpdated: -1 },
        },
        { $skip: (offset - 1) * limit },
        { $limit: +limit },
      ]),
      GroupParticipants.countDocuments(filter),
    ]);

    result.data = {
      groups,
      pages: Math.ceil(count / +limit),
      count,
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getFcmTokens = async (getFcmTokenssDto, result = {}) => {
  try {
    const { senderId, groupId } = getFcmTokenssDto;
    const now = new Date();

    const groups = await GroupParticipants.aggregate([
      {
        $match: {
          groupId: toObjectId(groupId),
          isApproved: true,
          isBlocked: false,
          userId: { $ne: toObjectId(senderId) },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "collections",
          localField: "_id",
          foreignField: "participantId",
          as: "collection",
        },
      },
      { $unwind: "$collection" },
      {
        $group: {
          _id: null,
          androidTokens: {
            $addToSet: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$user.platformName", "android"] },
                    {
                      $or: [
                        { $eq: ["$collection.isMuted", false] },
                        {
                          $and: [
                            { $ne: ["$collection.muteType", "always"] }, // OR use $nin
                            { $lt: ["$collection.mutedTill", now] },
                          ],
                        },
                      ],
                    },
                  ],
                },
                "$user.fcmToken",
                "$$REMOVE", // skip if not android
              ],
            },
          },
          iosTokens: {
            $addToSet: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$user.platformName", "ios"] },
                    {
                      $or: [
                        { $eq: ["$collection.isMuted", false] },
                        {
                          $and: [
                            { $ne: ["$collection.muteType", "always"] }, // OR use $nin
                            { $lt: ["$collection.mutedTill", now] },
                          ],
                        },
                      ],
                    },
                  ],
                },

                "$user.fcmToken",
                "$$REMOVE", // skip if not ios
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          androidTokens: 1,
          iosTokens: 1,
        },
      },
    ]);

    result.data = groups;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.blockUser = async (blockUsersDto, result = {}) => {
  try {
    const { userId, groupId, isBlocked } = blockUsersDto;

    const participant = await GroupParticipants.findOneAndUpdate(
      { groupId, userId },
      { isBlocked }
    );

    if (!participant) {
      result.participantNotFound = true;
    } else {
      await blockedMembersService.create({
        isBlocked,
        groupId,
        blockedId: userId,
      });

      result.data = participant;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
