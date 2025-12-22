const router = require("express").Router();
const { validate } = require("express-validation");
const messagesController = require("./messages.controller");
const messagesValidation = require("./messages.validation");
const JWT = require("../../common/auth/jwt");
const {
  isMessageOwner,
  isMessageReciever,
  checkChatMemberByMessageId,
  checkChatMember,
  checkChatMemberListing,
  checkBlockedMember,
  isSingleViewMessage,
  checkChatMemberByMessages,
  checkChatMessagesDeleteStatus,
} = require("./messages.middleware");

router.post(
  "/",
  [
    JWT.verifyAccessToken,
    validate(messagesValidation.create, { keyByField: true }),
    checkChatMember,
    checkBlockedMember,
  ],
  messagesController.create
);

router.patch(
  "/:id",
  [
    JWT.verifyAccessToken,
    validate(messagesValidation.update, { keyByField: true }),
    isMessageOwner,
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
    checkChatMemberByMessageId,
    checkBlockedMember,
  ],
  messagesController.reactToMesage
);
router.delete(
  "/many",
  [
    JWT.verifyAccessToken,
    validate(messagesValidation.deleteMessages, { keyByField: true }),
    checkChatMemberByMessages,
  ],
  messagesController.deleteMessages
);

router.post(
  "/undo-delete",
  [
    JWT.verifyAccessToken,
    validate(messagesValidation.deleteMessages, { keyByField: true }),
    checkChatMessagesDeleteStatus,
  ],
  messagesController.undoDeleteMessages
);

router.delete(
  "/:id",
  [
    JWT.verifyAccessToken,
    validate(messagesValidation.delete, { keyByField: true }),
    checkChatMemberByMessageId,
  ],
  messagesController.delete
);

router.get(
  "/",
  [
    JWT.verifyAccessToken,

    validate(messagesValidation.listMessages, { keyByField: true }),

    checkChatMemberListing,
  ],
  messagesController.listMessages
);

module.exports = router;
