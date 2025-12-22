const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const participantsService = require("./participants.service");
const blockedMembersService = require("../../blocked-members/blocked-members.service");

exports.isAdminOrOwner = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { groupId } = req.body;

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
    const { groupId } = req.query;

    const result = await participantsService.findOne({
      userId,
      groupId,
    });

    if (result.ex) throw result.ex;

    if (result.userNotFound)
      throw createError(StatusCodes.NOT_FOUND, "User not a member of group");

    if (!result.data.isOwner)
      throw createError(StatusCodes.FORBIDDEN, "Forbidden, not an owner");

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.checkParticipantRole = ({ mustBeMember, mustBeAdmin } = {}) => {
  return async (req, res, next) => {
    try {
      const { userId, groupId } = req.body;

      const result = await participantsService.findOne({
        userId,
        groupId,
      });

      if (result.ex) throw result.ex;

      const user = result?.data;

      if (mustBeMember !== undefined && mustBeMember && !user)
        throw createError(StatusCodes.NOT_FOUND, "User not in group");

      if (mustBeMember !== undefined && !mustBeMember && user)
        throw createError(StatusCodes.NOT_FOUND, "User already in group");

      if (mustBeAdmin !== undefined && mustBeAdmin && !user?.isAdmin)
        throw createError(StatusCodes.NOT_FOUND, "User is not an Admin");

      if (mustBeAdmin !== undefined && !mustBeAdmin && user?.isAdmin)
        throw createError(StatusCodes.NOT_FOUND, "User already an admin");

      // Attach user to request for downstream use
      req.body.user = user;

      next();
    } catch (ex) {
      next(ex);
    }
  };
};

exports.checkParticipantsRole = ({
  mustBeMember = false,
  mustBeAdmin = false,
} = {}) => {
  return async (req, res, next) => {
    try {
      const { participants, groupId } = req.body;

      const blockedMembers = [];

      for (const participant of participants) {
        const { userId } = participant;

        const result = await participantsService.findOne({
          userId,
          groupId,
        });

        const blockedResult = await blockedMembersService.findOne({
          blockedId: userId,
          groupId,
        });
        if (blockedResult.ex) throw blockedResult.ex;
        if (blockedResult.data) {
          participant.isBlocked = blockedResult.data.isBlocked;
          blockedMembers.push(userId);
        }

        if (result.ex) throw result.ex;

        const user = result?.data;

        if (mustBeMember && !user)
          throw createError(StatusCodes.NOT_FOUND, "User not in group");

        if (!mustBeMember && user)
          throw createError(StatusCodes.NOT_FOUND, "User already in group");

        if (mustBeAdmin && !user?.isAdmin)
          throw createError(StatusCodes.NOT_FOUND, "User is not an Admin");

        if (!mustBeAdmin && user?.isAdmin)
          throw createError(StatusCodes.NOT_FOUND, "User already an admin");
      }
      req.body.blockedMembers = blockedMembers;

      next();
    } catch (ex) {
      next(ex);
    }
  };
};

exports.checkParticipantApproval = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { groupId } = req.body;

    const result = await participantsService.findOne({
      userId,
      groupId,
    });

    if (result.ex) throw result.ex;

    const user = result?.data;

    if (!user)
      throw createError(StatusCodes.NOT_FOUND, "group Request not found");

    if (user.isApproved)
      throw createError(StatusCodes.NOT_FOUND, "User already approved");

    next();
  } catch (ex) {
    next(ex);
  }
};

exports.isOwnerBlockingAdmin = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { user, groupId } = req.body;

    const result = await participantsService.findOne({
      userId,
      groupId,
    });

    if (result.ex) throw result.ex;

    if (user.isAdmin && !result.data.isOwner)
      throw createError(StatusCodes.FORBIDDEN, "Only Owner can block Admin");

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
      const { groupId } = req.body || req.params;

      const result = await participantsService.findOne({
        userId,
        groupId,
      });

      if (result.ex) throw result.ex;

      if (result.participantNotFound)
        throw createError(StatusCodes.NOT_FOUND, "User not a member of Group");

      const participant = result.data;

      if (participant.isOwner) {
        next();
      } else if (participant.isAdmin) {
        if (changeInfo && !participant.permissions.changeInfo)
          throw createError(
            StatusCodes.FORBIDDEN,
            "Forbidden, not allowed to change group info"
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
