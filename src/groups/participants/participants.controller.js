const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const participantsService = require("./participants.service");
const {
  GROUP_TYPES,
  SUBSCRIPTION_STATUS,
} = require("../constants/groups.constants");

exports.create = async (req, res, next) => {
  try {
    const createsDto = {
      ...req.body,
    };

    const result = await participantsService.create(createsDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Participant created successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.removeParticipant = async (req, res, next) => {
  try {
    const removeParticipantsDto = {
      groupId: req.body.groupId,
      userId: req.body.userId,
    };

    const result = await participantsService.findOneAndDelete(
      removeParticipantsDto
    );

    if (result.ex) throw result.ex;

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Participant removed successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.updateParticipant = async (req, res, next) => {
  try {
    const updateParticipantsDto = {
      ...req.body,
    };

    const result = await participantsService.findOneAndUpdate(
      {
        groupId: req.body.groupId,
        userId: req.user.id,
      },
      {
        ...updateParticipantsDto,
        $set: { isApproved: true },
      }
    );
    if (result.ex) throw result.ex;
    if (result.participantNotFound) {
      throw createError(StatusCodes.NOT_FOUND, "Participant not found");
    }

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Participant updated successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.approveParticipant = async (req, res, next) => {
  try {
    const approveParticipantsDto = {
      userId: req.user.id,
      ...req.body,
    };

    const result = await participantsService.approveParticipant(
      approveParticipantsDto
    );

    if (result.ex) throw result.ex;

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Participant approved successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.updateAdmin = async (req, res, next) => {
  try {
    const { userId, permissions, groupId } = req.body;

    const result = await participantsService.findOneAndUpdate(
      { groupId, userId },
      { permissions }
    );

    if (result.ex) throw result.ex;

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Admin updated successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.addAdmin = async (req, res, next) => {
  try {
    const { userId, groupId, permissions } = req.body;

    const result = await participantsService.findOneAndUpdate(
      { groupId, userId },
      { isAdmin: true, permissions }
    );

    if (result.ex) throw result.ex;

    if (result.participantNotFound) {
      throw createError(StatusCodes.NOT_FOUND, "Participant not Found");
    }

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Admin added successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.removeAdmin = async (req, res, next) => {
  try {
    const { userId, groupId } = req.body;

    const result = await participantsService.findOneAndUpdate(
      { groupId, userId },
      {
        isAdmin: false,
        permissions: {
          changeInfo: false,
          postMessage: false,
          deleteMessage: false,
          pinMessage: false,
          addRemoveSubscribers: false,
          addNewAdmins: false,
        },
      }
    );

    if (result.ex) throw result.ex;

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Admin removed successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.listParticipants = async (req, res, next) => {
  try {
    const listParticipantsDto = {
      ...req.query,
    };

    const result = await participantsService.findAndCount(listParticipantsDto);

    if (result.ex) throw result.ex;

    if (result.groupNotFound) {
      throw createError(StatusCodes.NOT_FOUND, "group not found");
    }

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Participants listing successful",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.blockUser = async (req, res, next) => {
  try {
    const blockUsersDto = req.body;

    const { isBlocked } = blockUsersDto;

    const result = await participantsService.blockUser(blockUsersDto);

    const string = isBlocked ? "blocked" : "unblocked";

    if (result.ex) throw result.ex;

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: `User ${string} successfully`,
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
