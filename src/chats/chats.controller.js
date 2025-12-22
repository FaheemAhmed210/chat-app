const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const chatsService = require("./chats.service");

exports.create = async (req, res, next) => {
  try {
    const createChatsDto = {
      userId: req.user.id,
      ...req.body,
    };

    const result = await chatsService.create(createChatsDto);

    if (result.ex) throw result.ex;

    if (result.chatAlreadyExists) {
      throw createError(StatusCodes.CONFLICT, "Chat already exists");
    }
    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Chat created successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.muteChat = async (req, res, next) => {
  try {
    const muteChatsDto = {
      userId: req.user.id,
      chatId: req.params.id,
      ...req.body,
    };

    const result = await chatsService.muteChat(muteChatsDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Chat muted successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.clearChat = async (req, res, next) => {
  try {
    const clearChatsDto = {
      userId: req.user.id,
      chatId: req.params.id,
    };

    const result = await chatsService.clearChat(clearChatsDto);

    if (result.ex) throw result.ex;

    if (result.chatDoesNotExists) {
      throw createError(StatusCodes.NOT_FOUND, "Chat not found");
    }

    if (result.chatHasNoMessage) {
      throw createError(StatusCodes.BAD_REQUEST, "Chat has no messages");
    }

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Chat cleared successfully",
      // data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.listChats = async (req, res, next) => {
  try {
    const listChatsDto = { ...req.query, userId: req.user.id };
    const result = await chatsService.listChats(listChatsDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Chat Requests",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.getChat = async (req, res, next) => {
  try {
    const getChatDto = {
      userId: req.user.id,
      ...req.query,
      chatId: req.params.id,
    };

    const result = await chatsService.getChat(getChatDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Chat Details",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.getChatById = async (req, res, next) => {
  try {
    const getChatByIdsDto = {
      userId: req.user.id,
      chatId: req.params.id,
    };

    const result = await chatsService.getChatById(getChatByIdsDto);

    if (result.ex) throw result.ex;

    if (result.chatNotFound) {
      throw createError(StatusCodes.NOT_FOUND, "Chat not found");
    }

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Chat Details",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.getParticipants = async (req, res, next) => {
  try {
    const getParticipantsDto = {
      userId: req.user.id,
      ...req.query,
      chatId: req.params.id,
    };

    const result = await chatsService.getParticipants(getParticipantsDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Chat Participants",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.deleteChat = async (req, res, next) => {
  try {
    const deleteChatDto = {
      userId: req.user.id,
      chatId: req.params.id,
    };

    const result = await chatsService.deleteChat(deleteChatDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Chat Deleted",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const updateStatusDto = {
      userId: req.user.id,
      chatId: req.params.id,
      ...req.body,
    };

    const result = await chatsService.updateChatStatus(updateStatusDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Chat Updated",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
