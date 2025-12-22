const router = require("express").Router();
const { validate } = require("express-validation");
const chatsController = require("./chats.controller");
const chatsValidation = require("./chats.validation");
const JWT = require("../common/auth/jwt");
const { checkParticipant, checkChatMember } = require("./chats.middleware");
const messagesRouter = require("./messages/messages.router");

router.post(
  "/",
  [
    JWT.verifyAccessToken,

    validate(chatsValidation.create, { keyByField: true }),
    checkParticipant,
  ],

  chatsController.create
);

router.get(
  "/",
  [
    JWT.verifyAccessToken,
    validate(chatsValidation.listChats, { keyByField: true }),
  ],
  chatsController.listChats
);

router.patch(
  "/:id/mute",
  [
    JWT.verifyAccessToken,
    validate(chatsValidation.muteChat, { keyByField: true }),
    checkChatMember,
  ],
  chatsController.muteChat
);

router.delete(
  "/:id",
  [
    JWT.verifyAccessToken,
    validate(chatsValidation.mongoDBIdInParams, { keyByField: true }),

    checkChatMember,
  ],
  chatsController.deleteChat
);

router.patch(
  "/:id/clear",
  [
    JWT.verifyAccessToken,
    validate(chatsValidation.mongoDBIdInParams, { keyByField: true }),
  ],
  chatsController.clearChat
);
router.patch(
  "/:id/status",
  [
    JWT.verifyAccessToken,
    validate(chatsValidation.updateStatus, { keyByField: true }),
  ],
  chatsController.updateStatus
);

router.use("/messages", messagesRouter);

router.get(
  "/:id",
  [
    JWT.verifyAccessToken,
    validate(chatsValidation.mongoDBIdInParams, { keyByField: true }),
  ],
  chatsController.getChatById
);

module.exports = router;
