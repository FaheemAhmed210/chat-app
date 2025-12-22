const multerS3 = require("multer-s3");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { s3 } = require("../aws/s3/s3.util");
const configs = require("../../../configs");

module.exports.getMulterS3Storage = function (destinationFolder) {
  return multerS3({
    s3,
    bucket: configs.aws.s3.bucketName,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },

    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const uuid = uuidv4().replace(/-/gi, "");
      cb(
        null,
        `${destinationFolder}/${uuid}${path.extname(file.originalname)}`
      );
    },
  });
};
