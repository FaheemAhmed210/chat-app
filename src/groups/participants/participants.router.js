const router = require("express").Router();
const { validate } = require("express-validation");
const participantsController = require("./participants.controller");
const participantsValidation = require("./participants.validation");
const {
  isAdminOrOwner,
  isOwner,
  checkParticipantRole,
  checkParticipantApproval,
  checkParticipantsRole,
  isOwnerBlockingAdmin,
  checkAdminRole,
} = require("./participants.middleware");
const JWT = require("../../common/auth/jwt");

router.post(
  "/add",
  [
    JWT.verifyAccessToken,

    validate(participantsValidation.addParticipant, { keyByField: true }),
    checkAdminRole({ addRemoveSubscribers: true }),
    checkParticipantsRole({ mustBeMember: false }),
  ],
  participantsController.create
);

router.post(
  "/approve",
  [
    JWT.verifyAccessToken,
    validate(participantsValidation.approveParticipant, { keyByField: true }),
    checkParticipantApproval,
  ],
  participantsController.approveParticipant
);

router.post(
  "/remove",
  [
    JWT.verifyAccessToken,

    validate(participantsValidation.removeParticipant, { keyByField: true }),
    checkAdminRole({ addRemoveSubscribers: true }),
    checkParticipantRole({ mustBeMember: true }),
  ],
  participantsController.removeParticipant
);

router.post(
  "/add-admin",
  [
    JWT.verifyAccessToken,

    validate(participantsValidation.addAdmin, { keyByField: true }),
    checkAdminRole({ addNewAdmins: true }),
    checkParticipantRole({ mustBeMember: true, mustBeAdmin: false }),
  ],
  participantsController.addAdmin
);

router.post(
  "/remove-admin",
  [
    JWT.verifyAccessToken,

    validate(participantsValidation.addAdmin, { keyByField: true }),
    checkAdminRole({ addNewAdmins: true }),
    checkParticipantRole({ mustBeMember: true, mustBeAdmin: true }),
  ],
  participantsController.removeAdmin
);

router.post(
  "/update-admin",
  [
    JWT.verifyAccessToken,

    validate(participantsValidation.addAdmin, { keyByField: true }),
    checkAdminRole({ addNewAdmins: true }),
    checkParticipantRole({ mustBeMember: true, mustBeAdmin: true }),
  ],
  participantsController.updateAdmin
);

router.post(
  "/block-user",
  [
    JWT.verifyAccessToken,

    validate(participantsValidation.blockUser, { keyByField: true }),
    isAdminOrOwner,
    checkParticipantRole({ mustBeMember: true }),
    isOwnerBlockingAdmin,
  ],
  participantsController.blockUser
);

router.get(
  "/",
  [
    JWT.verifyAccessToken,

    validate(participantsValidation.listParticipants, { keyByField: true }),
  ],
  participantsController.listParticipants
);

router.post(
  "/update",

  [
    JWT.verifyAccessToken,

    validate(participantsValidation.updateParticipant, { keyByField: true }),
  ],
  participantsController.updateParticipant
);

module.exports = router;
