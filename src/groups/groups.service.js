const Group = require("./groups.model");
const mongoose = require("mongoose");
const {
  SUBSCRIPTION_STATUS,
  MESSAGE_TYPES,
  GROUP_TYPES,
} = require("../common/constants/collection.constants");

const {
  COLLECTION_TYPES,
  PARTICIPANT_TYPES,
} = require("../collections/constants/collections.constants");
const { toObjectId } = require("../common/moongoose/to-object-id");
const GroupParticipantsService = require("./participants/participants.service");
const GroupMessagesService = require("./messages/messages.service");
const GroupMessageStatusService = require("./message-status/messages-status.service");
const pinnedMessagesService = require("./pinned-messages/pinned-messages.service");
const CONSTANTS = require("../common/constants/constants");
const collectionsService = require("../collections/collections.service");
const usersService = require("../users/users.service");

exports.create = async (createGroupsDto, result = {}) => {
  try {
    const { userId, participants = [], ...restData } = createGroupsDto;

    participants.push({
      userId,
      isOwner: true,
      isAdmin: true,
      isApproved: true,
      permissions: {
        changeInfo: true,
        postMessage: true,
        pinMessage: true,
        deleteMessage: true,
        addRemoveSubscribers: true,
        mamangeJoinRequests: true,
        addNewAdmins: true,
      },
      subscription: {
        status: SUBSCRIPTION_STATUS.ACTIVE,
      },
    });

    const groupCreate = await Group.create({
      ...restData,
      owner: userId,
    });

    const groupParticipants = participants.map((participant) => ({
      groupId: groupCreate._id,
      ...participant,
    }));

    const insertedParticipants = await GroupParticipantsService.insertMany(
      groupParticipants
    );

    // 3. Find Owner Participant
    const ownerParticipant = insertedParticipants.data.find((p) => p.isOwner);

    // Here is the owner participantId
    const ownerParticipantId = ownerParticipant._id;

    // 4. Now create the collection using owner participant ID
    await collectionsService.create({
      userId,
      collectionId: groupCreate._id,
      collectionName: groupCreate?.name,
      collectionImage: groupCreate?.groupImage,
      type: COLLECTION_TYPES.GROUPS,
      participantId: ownerParticipantId,
      participantType: PARTICIPANT_TYPES.GROUP_PARTICIPANTS,
      ownerId: userId,
      isApproved: true,
    });

    result.data = groupCreate;
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

exports.getAllGroups = async (listGroupsDto, result = {}) => {
  try {
    const { offset, limit, userId } = listGroupsDto;

    const filter = {
      groupType: { $ne: GROUP_TYPES.PRIVATE },
    };

    const userObjectId = mongoose.Types.ObjectId.createFromHexString(userId);

    const [groups, count] = await Promise.all([
      Group.aggregate([
        { $match: filter },
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
                    case: { $regexMatch: { input: "$name", regex: /^[0-9]/ } },
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
            sortCategory: 1, // false (letters) first, true (numbers) last
            name: 1,
          },
        },
        { $skip: (offset - 1) * limit },
        { $limit: +limit },

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
        // project only needed fields
      ]),
      Group.countDocuments(filter),
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

exports.joinGroup = async (joinGroupsDto, result = {}) => {
  try {
    const { userId, subscription, groupId } = joinGroupsDto;

    const groupParticipantsResp = await GroupParticipantsService.createOne({
      userId,
      groupId,
      isApproved: true,
      ...(subscription && { subscription }),
    });

    if (groupParticipantsResp.data) {
      const group = await Group.findById(groupId);
      await collectionsService.create({
        userId,
        collectionId: groupId,
        collectionName: group?.name,
        collectionImage: group?.groupImage,
        type: COLLECTION_TYPES.GROUPS,
        participantId: groupParticipantsResp.data._id,
        participantType: PARTICIPANT_TYPES.GROUP_PARTICIPANTS,
        ownerId: group?.owner,
        isApproved: true,
      });
    }

    // 4. Now create the collection using owner participant ID

    if (groupParticipantsResp.ex) throw groupParticipantsResp.ex;
    result.data = groupParticipantsResp.data;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.transferOwnership = async (transferOwnershipDto, result = {}) => {
  try {
    const { groupId, userId } = transferOwnershipDto;

    const updatedGroup = await Group.findOneAndUpdate(
      { _id: groupId },
      {
        $addToSet: {
          transferRequests: { userId },
        },
      },
      { new: true }
    );

    if (!updatedGroup) {
      result.groupNotFound = true;
    } else {
      const usersResp = await usersService.findById(userId);
      const groupMessageResp = await GroupMessagesService.createMessage({
        groupId,
        sender: usersResp?.data,
        reciever: userId,
        content: {
          body: `Transfer ownership request for ${updatedGroup.name} group`,
          type: MESSAGE_TYPES.INFO,
        },
      });
      result.data = updatedGroup;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findByIdAndUpdate = async (groupId, groupUpdateDto, result = {}) => {
  try {
    const group = await Group.findByIdAndUpdate(
      groupId,
      {
        ...groupUpdateDto,
      },
      { new: true }
    );

    if (!group) {
      result.groupNotFound = true;
    } else {
      result.data = group;

      const { groupImage } = groupUpdateDto;

      if (groupImage) {
        await collectionsService.updateMany(
          { collectionId: groupId },
          {
            collectionImage: groupImage,
          }
        );
      }
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findById = async (groupId, result = {}) => {
  try {
    const group = await Group.findById(groupId);

    if (!group) {
      result.groupNotFound = true;
    } else {
      result.data = group;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.acceptOwnership = async (acceptOwnershipsDto, result = {}) => {
  try {
    const { groupId, userId } = acceptOwnershipsDto;

    const exists = await Group.findOneAndUpdate(
      {
        _id: groupId,
        "transferRequests.userId": userId, // only if this user is in requests
      },
      {
        $set: {
          owner: userId,
          transferRequests: [],
        },
      },
      { new: true }
    );

    if (!exists) {
      result.requestNotFound = true;
    } else {
      await Promise.all([
        GroupParticipantsService.findOneAndUpdate(
          { groupId, isOwner: true },
          {
            $set: {
              isOwner: false,
            },
          }
        ),
        GroupParticipantsService.findOneAndUpdate(
          { groupId, userId },
          {
            $set: {
              isOwner: true,
              permissions: {
                changeInfo: true,
                postMessage: true,
                pinMessage: true,
                deleteMessage: true,
                addRemoveSubscribers: true,
                mamangeJoinRequests: true,
                addNewAdmins: true,
              },
            },
          }
        ),
        collectionsService.updateMany(
          { collectionId: groupId },
          {
            ownerId: userId,
          }
        ),
      ]);

      result.data = exists;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.leaveGroup = async (leaveGroupsDto, result = {}) => {
  try {
    const { groupId, userId, user } = leaveGroupsDto;

    const [exists, collectionsResp] = await Promise.all([
      GroupParticipantsService.findOneAndDelete({
        groupId,
        userId,
      }),
      collectionsService.findOneAndDelete({
        collectionId: groupId,
        userId,
      }),
    ]);

    const group = await Group.findById(groupId).lean();
    if (user.isOwner) {
      let newOwnerId = null;

      if (group.transferRequests.length > 0) {
        newOwnerId = group.transferRequests[0].userId;
      } else {
        const newOwnerResp = await GroupParticipantsService.getNextOwner(
          groupId
        );

        if (newOwnerResp.data) {
          newOwnerId = newOwnerResp.data.userId;
        }
      }

      await Promise.all([
        Group.findByIdAndUpdate(
          groupId,

          {
            $set: {
              ownerId: newOwnerId, // transfer ownership
              transferRequests: [], // empty the array
            },
          },
          { new: true }
        ),
        GroupParticipantsService.findOneAndUpdate(
          { groupId, userId: newOwnerId },
          {
            $set: {
              isOwner: true,
              permissions: {
                changeInfo: true,
                postMessage: true,
                pinMessage: true,
                deleteMessage: true,
                addRemoveSubscribers: true,
                mamangeJoinRequests: true,
                addNewAdmins: true,
              },
            },
          }
        ),
        collectionsService.updateMany(
          { collectionId: groupId },
          {
            ownerId: newOwnerId,
          }
        ),
      ]);
    }

    result.data = exists;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.deleteGroup = async (deleteGroupsDto, result = {}) => {
  try {
    const { groupId } = deleteGroupsDto;

    const [group, participants, statuses] = await Promise.all([
      Group.findByIdAndDelete(groupId),
      GroupParticipantsService.deleteMany({
        groupId,
      }),
      GroupMessagesService.deleteMany({
        groupId,
      }),
      GroupMessageStatusService.deleteMany({
        groupId,
      }),
      collectionsService.deleteMany({
        collectionId: groupId,
      }),
    ]);

    result.data = group;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.muteGroup = async (muteGroupsDto, result = {}) => {
  try {
    const { userId, groupId, isMuted, duration } = muteGroupsDto;

    const now = Date.now();

    const mutedTillDate =
      duration == "8h"
        ? new Date(now + 8 * 60 * 60 * 1000)
        : duration == "1w"
        ? new Date(now + 7 * 24 * 60 * 60 * 1000)
        : null;

    const updateResp = await collectionsService.findOneAndUpdate(
      { userId, collectionId: groupId },
      {
        isMuted,
        mutedTill: mutedTillDate,
        muteType: duration,
      },
      { new: true }
    );

    if (!updateResp.participantNotFound) {
      result.data = updateResp.data;
    } else {
      result.participantNotFound = true;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getGroupById = async ({ groupId, userId }, result = {}) => {
  try {
    const group = await Group.findById(groupId)
      .populate(
        "owner",
        "userName profileImage  displayName  walletAddress btcWalletAddress solanaWalletAddress tronWalletAddress"
      )
      .populate("lastMessage")
      .lean();

    if (!group) {
      result.groupNotFound = true;
    } else {
      const [participantResp, pinnedMessageResp] = await Promise.all([
        GroupParticipantsService.findOne({
          groupId,
          userId,
        }),
        pinnedMessagesService.findOnePopulated({ groupId, userId }),
      ]);
      let user = null;

      if (participantResp.data) {
        user = {
          isApproved: participantResp?.data?.isApproved,
          isMember: true,
          subscription: participantResp?.data?.subscription,
        };
      }

      result.data = {
        ...group,
        ...(user && { user }),
        pinnedMessages: pinnedMessageResp?.data,
      };
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getPendingGroups = async (pendingGroupsDto, result = {}) => {
  try {
    const groupsResp = await GroupParticipantsService.getPendingGroups(
      pendingGroupsDto
    );

    if (groupsResp.ex) throw groupsResp.ex;

    result.data = groupsResp.data;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.clearGroup = async (clearGroupsDto, result = {}) => {
  try {
    const { userId, groupId } = clearGroupsDto;

    const group = await Group.findById(groupId);

    if (!group) {
      result.groupDoesNotExists = true;
    } else {
      const lastMessage = await GroupMessagesService.getLastMessage(groupId);

      if (lastMessage.data) {
        result.data = await collectionsService.findOneAndUpdate(
          { collectionId: toObjectId(groupId), userId },
          { clearedMessageId: lastMessage?.data?._id }
        );
      } else {
        result.groupHasNoMessage = true;
      }
    }
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
      Group.countDocuments(filter),
      Group.aggregate([
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

exports.updateGroupStatus = async (updateStatusDto, result = {}) => {
  try {
    const { groupId, status, userId } = updateStatusDto;

    const lastMessage = await GroupMessagesService.getLastMessage(groupId);

    if (lastMessage.data) {
      const messageId = lastMessage.data._id.toString();

      const [updateMessagesResp, collectiosResp] = await Promise.all([
        GroupMessagesService.updateMessageStatus({
          groupId,
          messageId,
          status,
          userId,
        }),
        collectionsService.findOneAndUpdate(
          {
            collectionId: groupId,
            userId,
          },
          { lastMessageRead: messageId }
        ),
      ]);
      result.data = updateMessagesResp?.data;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getAllGroupsWithSearch = async (listGroupsDto, result = {}) => {
  try {
    const { offset, limit, userId, search } = listGroupsDto;

    const filter = {
      groupType: { $ne: GROUP_TYPES.PRIVATE },
      ...(search && { name: { $regex: search, $options: "i" } }),
    };

    const userObjectId = mongoose.Types.ObjectId.createFromHexString(userId);

    const pipeline = [{ $match: filter }];

    if (search) {
      pipeline.push({
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
      });
    }

    pipeline.push({
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
                case: { $regexMatch: { input: "$name", regex: /^[0-9]/ } },
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
    pipeline.push(
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
      {
        $unwind: {
          path: "$owner",
          preserveNullAndEmptyArrays: true,
        },
      }
    );

    const groups = await Group.aggregate(pipeline);

    result.data = groups;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
