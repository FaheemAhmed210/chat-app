const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");

const participantsService = require("./participants/participants.service");
const groupsService = require("./groups.service");

const {
  GROUP_TYPES,
  SUBSCRIPTION_STATUS,
} = require("./constants/groups.constants");

exports.isAdminOrOwner = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { id: groupId } = req.params;

    const result = await participantsService.findOne({
      userId,
      groupId,
    });

    if (result.ex) throw result.ex;

    if (result.participantNotFound)
      throw createError(StatusCodes.NOT_FOUND, "User not a member of group");

    if (!result.data.isAdmin && !result.data.isOwner)
      throw createError(StatusCodes.FORBIDDEN, "Forbidden, not an admin");

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.isOwner = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { id: groupId } = req.params;

    const result = await participantsService.findOne({
      userId,
      groupId,
    });
    if (result.ex) throw result.ex;

    if (result.participantNotFound)
      throw createError(StatusCodes.NOT_FOUND, "User not a member of group");

    if (!result.data?.isOwner)
      throw createError(
        StatusCodes.FORBIDDEN,
        "Forbidden, only owner can perform this action"
      );

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.checkParticipant = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.body.userId;

    const result = await participantsService.findOne({
      userId,
      groupId,
    });

    if (result.ex) throw result.ex;
    const user = result.data;

    if (!user)
      throw createError(StatusCodes.NOT_FOUND, "User not a group member");

    req.body.user = user;

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.checkParticipantUser = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const { id: userId } = req.user;

    const result = await participantsService.findOne({
      userId,
      groupId,
    });

    if (result.ex) throw result.ex;
    const user = result.data;

    if (!user)
      throw createError(StatusCodes.NOT_FOUND, "User not a group member");

    req.body.user = user;

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.checkParticipantCount = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;

    const resultResp = await participantsService.countDocuments({
      groupId,
    });

    if (resultResp.ex) throw resultResp.ex;

    const count = resultResp.data;

    if (count <= 1)
      throw createError(
        StatusCodes.FORBIDDEN,
        "Group must have atleast 1 member"
      );

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.checkParticipantUserToJoin = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const { subscription } = req.body;
    const { id: userId } = req.user;

    const [participantsResp, groupsResp] = await Promise.all([
      participantsService.findOne({
        userId,
        groupId,
      }),
      groupsService.findById(groupId),
    ]);

    if (participantsResp.ex) throw participantsResp.ex;
    if (groupsResp.ex) throw groupsResp.ex;
    const user = participantsResp.data;
    const group = groupsResp.data;

    if (!group) throw createError(StatusCodes.NOT_FOUND, "Group Not found");

    if (user)
      throw createError(StatusCodes.NOT_FOUND, "User already a group member");

    if (
      group.groupType === GROUP_TYPES.PREMIUM &&
      !subscription?.status == SUBSCRIPTION_STATUS.ACTIVE
    )
      throw createError(
        StatusCodes.NOT_FOUND,
        "User cant join premium group without subscription"
      );

    req.body.user = user;

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.checkAdminRole = ({
  changeInfo = false,
  postMessage = false,
  deleteMessage = false,
  addRemoveSubscribers = false,
  manageJoinRequests = false,
  addNewAdmins = false,
} = {}) => {
  return async (req, res, next) => {
    try {
      const { id: userId } = req.user;
      const { id: groupId } = req.params;

      const result = await participantsService.findOne({
        userId,
        groupId,
      });

      if (result.ex) throw result.ex;

      if (result.participantNotFound)
        throw createError(
          StatusCodes.NOT_FOUND,
          "User not a member of channel"
        );

      const participant = result.data;

      if (participant.isOwner) {
        next();
      } else if (participant.isAdmin) {
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
        throw createError(
          StatusCodes.FORBIDDEN,
          "Forbidden, not an admin or owner"
        );
      }
    } catch (ex) {
      next(ex);
    }
  };
};
