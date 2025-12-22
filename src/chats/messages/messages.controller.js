const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const messagesService = require("./messages.service");

exports.create = async (req, res, next) => {
  try {
    const createMessageDto = {
      userId: req.user.id,
      ...req.body,
    };

    const result = await messagesService.create(createMessageDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Message sent successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const deleteMessageDto = {
      userId: req.user.id,
      ...req.body,
      messageId: req.params.id,
    };

    const result = await messagesService.deleteMessage(deleteMessageDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Message Deleted",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.deleteMessages = async (req, res, next) => {
  try {
    const deleteMessagesDto = {
      userId: req.user.id,
      ...req.body,
    };

    const result = await messagesService.deleteMessages(deleteMessagesDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Message Deleted",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.undoDeleteMessages = async (req, res, next) => {
  try {
    const deleteMessagesDto = {
      userId: req.user.id,
      ...req.body,
    };

    const result = await messagesService.undoDeleteMessages(deleteMessagesDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Message Deleted",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updateMessageDto = {
      userId: req.user.id,
      messageId: req.params.id,
      ...req.body,
    };

    const result = await messagesService.updateMessage(updateMessageDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Message Updated",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const updateMessageDto = {
      userId: req.user.id,
      messageId: req.params.id,
      ...req.body,
    };

    const result = await messagesService.updateMessageStatus(updateMessageDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Message Updated",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.updateSingleViewStatus = async (req, res, next) => {
  try {
    const updateMessageDto = {
      userId: req.user.id,
      messageId: req.params.id,
      ...req.body,
    };

    const result = await messagesService.updateSingleViewStatus(
      updateMessageDto
    );

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Message Updated",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.reactToMesage = async (req, res, next) => {
  try {
    const reactToMesageDto = {
      userId: req.user.id,
      messageId: req.params.id,
      ...req.body,
    };

    const result = await messagesService.reactToMesage(reactToMesageDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Message Reacted",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.listMessages = async (req, res, next) => {
  try {
    const listMessagesDto = {
      ...req.query,
      userId: req.user.id,
    };

    const result = await messagesService.listMessages(listMessagesDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Message Listing Success",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
