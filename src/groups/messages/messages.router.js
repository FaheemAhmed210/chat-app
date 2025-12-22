const router = require("express").Router();
const { validate } = require("express-validation");
const messagesController = require("./messages.controller");
const messagesValidation = require("./messages.validation");
const JWT = require("../../common/auth/jwt");

const {
  checkGroupMember,
  isMessageOwner,
  checkGroupMemberForMessage,
  isMessageReciever,
  checkDeleteType,
  isBlocked,
  isSingleViewMessage,
  isGroupAdmin,
  checkGroupMemberByMessages,
  checkAdminRole,
  checkGroupMessagesdeleteStatus,
} = require("./messages.middleware");

router.post(
  "/",
  [
    JWT.verifyAccessToken,
    validate(messagesValidation.create, { keyByField: true }),
    checkGroupMember,
  ],
  messagesController.create
);

router.patch(
  "/:id",
  [
    JWT.verifyAccessToken,
    isMessageOwner,

    validate(messagesValidation.update, { keyByField: true }),
  ],
  messagesController.update
);

router.patch(
  "/:id/status",
  [
    JWT.verifyAccessToken,

    validate(messagesValidation.updateStatus, { keyByField: true }),
    isMessageReciever,
  ],
  messagesController.updateStatus
);

router.post(
  "/pin-message",
  [
    JWT.verifyAccessToken,

    validate(messagesValidation.pinMessage, { keyByField: true }),
    checkAdminRole({ pinMessage: true }),
  ],
  messagesController.pinMessage
);

router.patch(
  "/:id/single-view-status",
  [
    JWT.verifyAccessToken,
    validate(messagesValidation.updateSingleViewStatus, { keyByField: true }),
    isMessageReciever,
    isSingleViewMessage,
  ],
  messagesController.updateSingleViewStatus
);

router.patch(
  "/:id/react",
  [
    JWT.verifyAccessToken,
    validate(messagesValidation.reactToMesage, { keyByField: true }),
    isMessageReciever,
    isBlocked,
  ],
  messagesController.reactToMesage
);

router.delete(
  "/many",
  [
    JWT.verifyAccessToken,
    validate(messagesValidation.deleteMessages, { keyByField: true }),
    checkGroupMemberByMessages,
    // checkAdminRole({ deleteMessage: true }),
  ],
  messagesController.deleteMessages
);

router.post(
  "/undo-delete",
  [
    JWT.verifyAccessToken,
    validate(messagesValidation.deleteMessages, { keyByField: true }),
    checkGroupMessagesdeleteStatus,
    // checkAdminRole({ deleteMessage: true }),
  ],
  messagesController.undoDeleteMessages
);

router.delete(
  "/:id",
  [
    JWT.verifyAccessToken,
    validate(messagesValidation.delete, { keyByField: true }),
    checkAdminRole({ deleteMessage: true }),
    checkDeleteType,
  ],
  messagesController.delete
);

router.get(
  "/",
  [
    JWT.verifyAccessToken,

    validate(messagesValidation.listMessages, { keyByField: true }),
    checkGroupMemberForMessage,
  ],
  messagesController.listMessages
);

module.exports = router;
