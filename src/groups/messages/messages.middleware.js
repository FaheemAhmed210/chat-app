const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const participantsService = require("../participants/participants.service");
const {
  UPATE_MESSAGE_STATUS,
  MESSAGE_STATUS,
  GROUP_TYPES,
  SUBSCRIPTION_STATUS,
  DELETE_TYPE,
  VIEW_TYPE,
} = require("../constants/groups.constants");
const groupMessagesService = require("./messages.service");
const groupService = require("../groups.service");
const messageStatusService = require("../message-status/messages-status.service");
const messageOpenStatusService = require("../message-open-status/messages-open-status.service");
const usersService = require("../../users/users.service");

exports.checkGroupMember = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { groupId } = req.body;

    const [result, sendersResp] = await Promise.all([
      participantsService.findOne({
        userId,
        groupId,
      }),
      usersService.findById(userId),
    ]);

    if (result.ex) throw result.ex;

    if (sendersResp.userNotFound)
      throw createError(StatusCodes.NOT_FOUND, "User Not found");

    req.body.sender = sendersResp.data;

    if (result.userNotFound)
      throw createError(StatusCodes.FORBIDDEN, "User Not found in group");

    const participant = result.data;

    if (participant.isBlocked) {
      throw createError(StatusCodes.FORBIDDEN, "User is Blocked");
    }

    if (!participant?.isAdmin && !participant?.isOwner) {
      const groupResp = await groupService.findById(groupId);
      if (groupResp.ex) throw groupResp.ex;
      if (groupResp.groupNotFound)
        throw createError(StatusCodes.NOT_FOUND, "Group Not found");

      const group = groupResp.data;
      if (
        group.groupType === GROUP_TYPES.PREMIUM &&
        result.data?.subscription?.status !== SUBSCRIPTION_STATUS.ACTIVE
      ) {
        throw createError(StatusCodes.FORBIDDEN, "User Not found in group");
      }
    }

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.isMessageOwner = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { id: messageId } = req.params;

    const result = await groupMessagesService.findById(messageId);

    if (result.ex) throw result.ex;

    if (result.messageNotFound)
      throw createError(StatusCodes.NOT_FOUND, "Message Not found");

    const message = result.data;

    // if (message.sender.toString() !== userId)
    //   throw createError(StatusCodes.FORBIDDEN, "User Not message owner");

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.checkDeleteType = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { id: messageId } = req.params;
    const { deleteType, participant } = req.body;

    if (
      deleteType === DELETE_TYPE.DELETE_FOR_EVERYONE &&
      !participant.permissions.deleteMessage
    ) {
      const result = await groupMessagesService.findById(messageId);

      if (result.ex) throw result.ex;

      if (result.messageNotFound)
        throw createError(StatusCodes.NOT_FOUND, "User Not found in group");

      const message = result.data;

      if (message.sender.toString() !== userId.toString())
        throw createError(StatusCodes.FORBIDDEN, "User Not message owner");
    }

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.isMessageReciever = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { id: messageId } = req.params;
    const { status } = req.body;

    const result = await groupMessagesService.findById(messageId);

    if (result.ex) throw result.ex;

    if (result.messageNotFound)
      throw createError(StatusCodes.NOT_FOUND, "Message Not found");

    const message = result.data;

    if (
      message.status === MESSAGE_STATUS.READ ||
      (message.status === MESSAGE_STATUS.DELIVERED &&
        status === UPATE_MESSAGE_STATUS.DELIVERED)
    ) {
      throw createError(StatusCodes.CONFLICT, "Message status already updated");
    }

    // if (userId.toString() === message.sender.toString()) {
    //   throw createError(StatusCodes.FORBIDDEN, "User Not message reciever");
    // }

    const groupId = message.groupId;

    const participantsResp = await participantsService.findOne({
      userId,
      groupId,
      // createdAt: { $lte: message.createdAt },
    });

    if (participantsResp.ex) throw participantsResp.ex;

    if (participantsResp.participantNotFound)
      throw createError(StatusCodes.FORBIDDEN, "User Not message reciever");

    const participant = participantsResp.data;

    if (!participant?.isAdmin && !participant?.isOwner) {
      const groupResp = await groupService.findById(groupId);
      if (groupResp.ex) throw groupResp.ex;
      if (groupResp.groupNotFound)
        throw createError(StatusCodes.NOT_FOUND, "Group Not found");

      const group = groupResp.data;
      if (
        group.groupType === GROUP_TYPES.PREMIUM &&
        participant?.subscription?.status !== SUBSCRIPTION_STATUS.ACTIVE
      ) {
        throw createError(StatusCodes.FORBIDDEN, "User Not found in group");
      }
    }

    req.body.groupId = groupId;
    req.body.participant = participant;

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.checkMessageStatus = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { id: messageId } = req.params;
    const { status } = req.body;

    const result = await messageStatusService.findOne({ messageId });

    if (result.ex) throw result.ex;

    if (result.messageStatusNotFound)
      throw createError(StatusCodes.NOT_FOUND, "Message Not found");

    const messageStatus = result.data;

    if (messageStatus.sender.toString() === userId)
      throw createError(StatusCodes.FORBIDDEN, "owner status cant be updated");

    const isSeen = messageStatus.seenBy.some(
      (entry) => entry.userId.toString() === userId
    );
    const isDelivered = messageStatus.deliveredTo.some(
      (entry) => entry.userId.toString() === userId
    );

    if (
      (status === UPATE_MESSAGE_STATUS.SEEN && isSeen) ||
      (status === UPATE_MESSAGE_STATUS.DELIVERED && isDelivered)
    ) {
      throw createError(StatusCodes.CONFLICT, `Already marked as ${status}`);
    }

    req.body.isDelivered = isDelivered;

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.checkGroupMemberForMessage = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { groupId } = req.query;

    const [groupResp, participantResp] = await Promise.all([
      groupService.findById(groupId),
      participantsService.findOne({
        userId,
        groupId,
      }),
    ]);
    if (groupResp.ex) throw groupResp.ex;
    if (participantResp.ex) throw participantResp.ex;
    if (groupResp.groupNotFound) {
      throw createError(StatusCodes.NOT_FOUND, "Group Not found");
    }

    const group = groupResp.data;
    if (
      group.groupType !== GROUP_TYPES.PUBLIC &&
      participantResp.participantNotFound
    ) {
      throw createError(StatusCodes.FORBIDDEN, "User Not a group member");
    }

    const participant = participantResp.data;

    if (
      group.groupType == GROUP_TYPES.PRIVATE &&
      !participant.isApproved &&
      !participant.isOwner &&
      !participant.isAdmin
    ) {
      throw createError(StatusCodes.FORBIDDEN, "User Not a group member");
    }

    if (
      group.groupType == GROUP_TYPES.PREMIUM &&
      participant.subscription?.status !== SUBSCRIPTION_STATUS.ACTIVE &&
      !participant.isOwner &&
      !participant.isAdmin
    ) {
      throw createError(StatusCodes.FORBIDDEN, "User Not a group member");
    }

    if (
      participant?.subscription?.status === SUBSCRIPTION_STATUS.ACTIVE &&
      participant?.subscription?.expiresAt < new Date(Date.now()) &&
      !participant.isOwner
    ) {
      await participantsService.findOneAndUpdate(
        { userId: participant.userId, groupId: participant.groupId },
        { $set: { "subscription.status": "inactive" } }
      );
      throw createError(StatusCodes.FORBIDDEN, "User Not a group member");
    }

    const clearedEntry = group.clearedBy.filter(
      (entry) => entry.userId.toString() === userId.toString()
    )[0];

    if (clearedEntry?.messageId) {
      req.query.messageFilterId = clearedEntry.messageId.toString();
    }
    req.query.isBlocked = participant?.isBlocked;

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.isBlocked = async (req, res, next) => {
  try {
    const { participant } = req.body;

    if (participant?.isBlocked) {
      throw createError(StatusCodes.FORBIDDEN, "User is Blocked");
    }

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.isSingleViewMessage = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { id: messageId } = req.params;

    const result = await groupMessagesService.findById(messageId);

    if (result.ex) throw result.ex;

    if (result.messageNotFound)
      throw createError(StatusCodes.NOT_FOUND, "Message Not found");

    const message = result.data;

    if (message.viewType !== VIEW_TYPE.ONE_TIME_VIEW)
      throw createError(StatusCodes.NOT_FOUND, "Message Not one time View ");

    const result2 = await messageOpenStatusService.findOne({ messageId });

    if (result2.ex) throw result2.ex;

    if (result2.messageStatusNotFound)
      throw createError(StatusCodes.NOT_FOUND, "Message Not found");

    const messageStatus = result2.data;

    if (messageStatus.sender.toString() === userId)
      throw createError(StatusCodes.FORBIDDEN, "owner status cant be updated");

    const isOpened = messageStatus.openedBy.some(
      (entry) => entry.userId.toString() === userId
    );

    if (isOpened) {
      throw createError(StatusCodes.CONFLICT, `Already marked as Opened`);
    }
    next();
  } catch (ex) {
    next(ex);
  }
};

exports.isGroupAdmin = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { messageId } = req.body;

    const result = await groupMessagesService.findById(messageId);

    if (result.ex) throw result.ex;

    if (result.messageNotFound)
      throw createError(StatusCodes.NOT_FOUND, "Message Not found");

    const message = result.data;

    const groupId = message.groupId;

    const participantsResp = await participantsService.findOne({
      userId,
      groupId,
    });

    if (participantsResp.ex) throw participantsResp.ex;

    const participant = participantsResp.data;

    if (!participant?.isAdmin && !participant?.isOwner) {
      throw createError(StatusCodes.FORBIDDEN, "Only Admin can pin message");
    }

    req.body.groupId = groupId;
    req.body.participant = participant;

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.checkGroupMemberByMessages = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { messageIds, deleteType } = req.body;

    const messageResp = await groupMessagesService.find({
      _id: { $in: messageIds },
      // ...(deleteType == DELETE_TYPE.DELETE_FOR_EVERYONE &&
      //   !participant?.permissions?.deleteMessage && { sender: userId }),
    });

    if (messageResp.ex) throw messageResp.ex;

    if (messageResp.data.length !== messageIds.length)
      throw createError(StatusCodes.FORBIDDEN, "Some messages do not exist");

    const messages = messageResp.data;

    const uniqueGroupIds = [
      ...new Set(messages.map((m) => m.groupId.toString())),
    ];

    if (uniqueGroupIds.length > 1) {
      throw createError(400, "All messages must belong to the same group");
    }

    const groupId = uniqueGroupIds[0];

    const participantsResp = await participantsService.findOne({
      userId,
      groupId,
    });

    messages.forEach((message) => {
      if (
        message.sender.toString() !== userId.toString() &&
        deleteType === DELETE_TYPE.DELETE_FOR_EVERYONE &&
        !participantsResp.data?.permissions?.deleteMessage
      ) {
        throw createError(
          StatusCodes.FORBIDDEN,
          "Some messages were not sent by you or you dont have permissions"
        );
      }
    });

    if (participantsResp.ex) throw participantsResp.ex;
    if (!participantsResp.data) {
      throw createError(StatusCodes.FORBIDDEN, "Not a Group Member");
    }

    req.body.groupId = groupId;

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.checkAdminRole = ({
  changeInfo = false,
  postMessage = false,
  deleteMessage = false,
  pinMessage = false,
  addRemoveSubscribers = false,
  manageJoinRequests = false,
  addNewAdmins = false,
} = {}) => {
  return async (req, res, next) => {
    try {
      const { id: userId } = req.user;
      let { groupId } = req.body || req.params;

      if (!groupId) {
        const messageId = req.params.id || req.body.messageId;
        const messageResult = await groupMessagesService.findById(messageId);
        if (messageResult.ex) throw messageResult.ex;
        if (messageResult.messageNotFound)
          throw createError(StatusCodes.NOT_FOUND, "Message Not found");
        groupId = messageResult.data.groupId;
      }

      const result = await participantsService.findOne({
        userId,
        groupId,
      });

      if (result.ex) throw result.ex;

      if (result.participantNotFound)
        throw createError(StatusCodes.NOT_FOUND, "User not a member of group");

      const participant = result.data;
      req.body.participant = participant;
      req.body.groupId = groupId;

      if (participant.isOwner) {
        next();
      } else if (participant.isAdmin) {
        if (participant.isBlocked && !participant.permissions.changeInfo)
          throw createError(
            StatusCodes.FORBIDDEN,
            "Forbidden, not allowed to change channel info"
          );
        if (changeInfo && !participant.permissions.changeInfo)
          throw createError(
            StatusCodes.FORBIDDEN,
            "Forbidden, not allowed to change channel info"
          );
        if (postMessage && !participant.permissions.postMessage)
          throw createError(
            StatusCodes.FORBIDDEN,
            "Forbidden, not allowed to post messages"
          );
        if (pinMessage && !participant.permissions.pinMessage)
          throw createError(
            StatusCodes.FORBIDDEN,
            "Forbidden, not allowed to pin messages"
          );
        if (deleteMessage && !participant.permissions.deleteMessage)
          throw createError(
            StatusCodes.FORBIDDEN,
            "Forbidden, not allowed to delete messages"
          );
        if (
          addRemoveSubscribers &&
          !participant.permissions.addRemoveSubscribers
        )
          throw createError(
            StatusCodes.FORBIDDEN,
            "Forbidden, not allowed to add/remove subscribers"
          );
        if (manageJoinRequests && !participant.permissions.mamangeJoinRequests)
          throw createError(
            StatusCodes.FORBIDDEN,
            "Forbidden, not allowed to manage join requests"
          );
        if (addNewAdmins && !participant.permissions.addNewAdmins)
          throw createError(
            StatusCodes.FORBIDDEN,
            "Forbidden, not allowed to add new admins"
          );
        next();
      } else {
        const { deleteType } = req.body;
        if (deleteMessage && deleteType == DELETE_TYPE.DELETE_FOR_ME) {
          next();
        } else {
          throw createError(
            StatusCodes.FORBIDDEN,
            "Forbidden, not an admin or owner"
          );
        }
      }
    } catch (ex) {
      next(ex);
    }
  };
};

exports.checkGroupMessagesdeleteStatus = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { messageIds, deleteType } = req.body;

    const messageResp = await groupMessagesService.find({
      _id: { $in: messageIds },
      // ...(deleteType == DELETE_TYPE.DELETE_FOR_EVERYONE &&
      //   !participant?.permissions?.deleteMessage && { sender: userId }),
    });

    if (messageResp.ex) throw messageResp.ex;

    if (messageResp.data.length !== messageIds.length)
      throw createError(StatusCodes.FORBIDDEN, "Some messages do not exist");

    const messages = messageResp.data;

    const uniqueGroupIds = [
      ...new Set(messages.map((m) => m.groupId.toString())),
    ];

    if (uniqueGroupIds.length > 1) {
      throw createError(400, "All messages must belong to the same group");
    }

    const groupId = uniqueGroupIds[0];

    const participantsResp = await participantsService.findOne({
      userId,
      groupId,
    });
    if (participantsResp.ex) throw participantsResp.ex;
    if (!participantsResp.data) {
      throw createError(StatusCodes.FORBIDDEN, "Not a Group Member");
    }

    messages.forEach((message) => {
      if (deleteType === DELETE_TYPE.DELETE_FOR_EVERYONE) {
        if (!participantsResp.data?.permissions?.deleteMessage) {
          throw createError(
            StatusCodes.FORBIDDEN,
            "You do not have permission to undo delete"
          );
        }
        if (!message?.isDeletedForEveryone) {
          throw createError(
            StatusCodes.FORBIDDEN,
            "Some messages were not deleted"
          );
        }
      } else {
        const isDeletedForUser = message.deletedFor.some(
          (id) => id?.toString() === userId?.toString()
        );
        if (!isDeletedForUser) {
          throw createError(
            StatusCodes.FORBIDDEN,
            "Some messages were not deleted"
          );
        }
      }
    });

    req.body.groupId = groupId;

    next();
  } catch (ex) {
    next(ex);
  }
};
