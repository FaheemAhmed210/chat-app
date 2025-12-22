const router = require("express").Router();
const mediaController = require("./medias.controller");
const mediasValidation = require("./medias.validation");
const { validate } = require("express-validation");
const JWT = require("../common/auth/jwt");
const { multerFileUploader } = require("../common/file/file.uploader");
const { mediaConstants } = require("./constants/medias.file.constant");
const { fileRequired } = require("../common/file/file.middleware");
router.post(
  "/upload",
  [
    // JWT.verifyAccessToken,
    multerFileUploader(mediaConstants),
    fileRequired(mediaConstants.fieldName),
  ],
  mediaController.uploadImage
);

router.post(
  "/multipart-upload/init",
  [
    // JWT.verifyAccessToken,
    validate(mediasValidation.initializeMultipartUpload, {
      keyByField: true,
    }),
  ],
  mediaController.initializeMultipartUpload
);

router.post(
  "/multipart-upload/presigned-urls",
  [
    // JWT.verifyAccessToken,
    validate(mediasValidation.createPartsPresignedUrls, {
      keyByField: true,
    }),
  ],
  mediaController.createPresignedUrlsForParts
);

router.patch(
  "/multipart-upload/finalize",
  [
    // JWT.verifyAccessToken,
    validate(mediasValidation.finalizeMultipartUpload, {
      keyByField: true,
    }),
  ],
  mediaController.finalizeMultipartUpload
);

router.delete(
  "/",

  [
    // JWT.verifyAccessToken,
    validate(mediasValidation.deleteMultipleMedia, {
      keyByField: true,
    }),
  ],
  mediaController.deleteMultipleMedia
);

module.exports = router;
