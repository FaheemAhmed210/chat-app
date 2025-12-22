const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const groupsService = require("./groups.service");

exports.create = async (req, res, next) => {
  try {
    const createGroupsDto = {
      userId: req.user.id,
      ...req.body,
    };

    const result = await groupsService.create(createGroupsDto);

    if (result.ex) throw result.ex;

    if (result.hasConflict) {
      throw createError(StatusCodes.CONFLICT, result.conflictMessage);
    }
    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Group created successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getAllGroups = async (req, res, next) => {
  try {
    const listGroupsDto = { ...req.query, userId: req.user.id };
    const result = await groupsService.getAllGroups(listGroupsDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Group Requests",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.updateGroup = async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const updateGroupsDto = {
      ...req.body,
    };

    const result = await groupsService.findByIdAndUpdate(
      groupId,
      updateGroupsDto
    );

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Group Updated",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.transferOwnership = async (req, res, next) => {
  try {
    const transferOwnershipsDto = {
      groupId: req.params.id,
      ...req.body,
    };

    const result = await groupsService.transferOwnership(transferOwnershipsDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Group Updated",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.acceptOwnership = async (req, res, next) => {
  try {
    const acceptOwnershipsDto = {
      groupId: req.params.id,
      userId: req.user.id,
      ...req.body,
    };

    const result = await groupsService.acceptOwnership(acceptOwnershipsDto);

    if (result.ex) throw result.ex;

    if (result.requestNotFound) {
      throw createError(StatusCodes.NOT_FOUND, "Request not Found");
    }

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Group Updated",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.deleteGroup = async (req, res, next) => {
  try {
    const deleteGroupsDto = {
      groupId: req.params.id,
    };

    const result = await groupsService.deleteGroup(deleteGroupsDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Group Updated",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.joinGroup = async (req, res, next) => {
  try {
    const joinGroupsDto = {
      groupId: req.params.id,
      userId: req.user.id,
      ...req.body,
    };

    const result = await groupsService.joinGroup(joinGroupsDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Group Updated",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.leaveGroup = async (req, res, next) => {
  try {
    const leaveGroupsDto = {
      groupId: req.params.id,
      userId: req.user.id,
      ...req.body,
    };

    const result = await groupsService.leaveGroup(leaveGroupsDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Group Updated",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.getGroupById = async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;

    const result = await groupsService.getGroupById({ groupId, userId });

    if (result.ex) throw result.ex;

    if (result.groupNotFound) {
      throw createError(StatusCodes.NOT_FOUND, "Group not found");
    }

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Group Fetched Successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.muteGroup = async (req, res, next) => {
  try {
    const muteGroupsDto = {
      userId: req.user.id,
      groupId: req.params.id,
      ...req.body,
    };

    const result = await groupsService.muteGroup(muteGroupsDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Group muted successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.getPendingGroups = async (req, res, next) => {
  try {
    const pendingGroupsDto = { ...req.query, userId: req.user.id };
    const result = await groupsService.getPendingGroups(pendingGroupsDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Group Requests",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.clearGroup = async (req, res, next) => {
  try {
    const clearGroupsDto = {
      userId: req.user.id,
      groupId: req.params.id,
    };

    const result = await groupsService.clearGroup(clearGroupsDto);

    if (result.ex) throw result.ex;

    if (result.groupDoesNotExists) {
      throw createError(StatusCodes.NOT_FOUND, "Group not found");
    }

    if (result.groupHasNoMessage) {
      throw createError(StatusCodes.BAD_REQUEST, "Group has no messages");
    }

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Group cleared successfully",
      // data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const updateStatusDto = {
      userId: req.user.id,
      groupId: req.params.id,
      ...req.body,
    };

    const result = await groupsService.updateGroupStatus(updateStatusDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Group Updated",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
