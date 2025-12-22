const router = require("express").Router({ mergeParams: true });
const { validate } = require("express-validation");
const groupsController = require("./groups.controller");
const groupsValidation = require("./groups.validation");
const JWT = require("../common/auth/jwt");
const {
  isAdminOrOwner,
  isOwner,
  checkParticipant,
  checkParticipantUser,
  checkParticipantUserToJoin,
  checkParticipantCount,
  checkAdminRole,
} = require("./groups.middleware");

const participantsRouter = require("./participants/participants.router");
const groupMessagesRouter = require("./messages/messages.router");

router.post(
  "/",
  [
    JWT.verifyAccessToken,
    validate(groupsValidation.create, { keyByField: true }),
  ],
  groupsController.create
);

router.get(
  "/pending-requests",
  [
    JWT.verifyAccessToken,
    validate(groupsValidation.getAllGroups, { keyByField: true }),
  ],
  groupsController.getPendingGroups
);

router.get(
  "/",
  [
    JWT.verifyAccessToken,
    validate(groupsValidation.getAllGroups, { keyByField: true }),
  ],
  groupsController.getAllGroups
);

router.patch(
  "/:id",

  [
    JWT.verifyAccessToken,
    checkAdminRole({ changeInfo: true }),
    validate(groupsValidation.update, { keyByField: true }),
  ],
  groupsController.updateGroup
);

router.patch(
  "/:id/clear",
  [
    JWT.verifyAccessToken,
    validate(groupsValidation.idInParams, { keyByField: true }),
    checkParticipantUser,
  ],
  groupsController.clearGroup
);

router.patch(
  "/:id/transfer-ownership",

  [
    JWT.verifyAccessToken,
    isOwner,
    validate(groupsValidation.idInParams, { keyByField: true }),
    validate(groupsValidation.transferOwnership, { keyByField: true }),
    checkParticipant,
  ],
  groupsController.transferOwnership
);

router.patch(
  "/:id/accept-ownership",

  [
    JWT.verifyAccessToken,
    validate(groupsValidation.idInParams, { keyByField: true }),
  ],

  groupsController.acceptOwnership
);

router.patch(
  "/:id/mute",
  [
    JWT.verifyAccessToken,
    validate(groupsValidation.muteGroup, { keyByField: true }),
    checkParticipantUser,
  ],
  groupsController.muteGroup
);

router.patch(
  "/:id/status",
  [
    JWT.verifyAccessToken,
    validate(groupsValidation.updateStatus, { keyByField: true }),
  ],
  groupsController.updateStatus
);
router.post(
  "/:id/leave",

  [
    JWT.verifyAccessToken,
    validate(groupsValidation.idInParams, { keyByField: true }),
    checkParticipantUser,
    checkParticipantCount,
  ],

  groupsController.leaveGroup
);

router.post(
  "/:id/join",

  [
    JWT.verifyAccessToken,
    validate(groupsValidation.idInParams, { keyByField: true }),
    validate(groupsValidation.joinGroup, { keyByField: true }),
  ],
  checkParticipantUserToJoin,

  groupsController.joinGroup
);

router.delete(
  "/:id",
  [
    JWT.verifyAccessToken,
    validate(groupsValidation.idInParams, { keyByField: true }),
  ],
  isOwner,

  groupsController.deleteGroup
);

router.use(
  "/:id/participants",
  [validate(groupsValidation.groupIdinParams, { keyByField: true })],

  (req, res, next) => {
    req.body.groupId = req.params.id;
    req.query.groupId = req.params.id;
    next();
  },
  participantsRouter
);
router.use("/messages", groupMessagesRouter);

router.get(
  "/:id",
  [
    JWT.verifyAccessToken,
    validate(groupsValidation.mongoDBIdInParams, { keyByField: true }),
  ],
  groupsController.getGroupById
);

module.exports = router;
