const multer = require("multer");
const createError = require("http-errors");
const { StatusCodes } = require("http-status-codes");
const { getMulterS3Storage } = require("./file.storage");
const { validatePayload } = require("./file.validate");

module.exports.multerFileUploader = function (fileUploadConfigs) {
  const {
    fieldName,
    destinationFolder,
    allowedImageTypes,
    maxFileSizeInMBs,
    validationSchema,
  } = fileUploadConfigs;

  const fileUploader = multer({
    storage: getMulterS3Storage(destinationFolder),
    fileFilter: (req, file, cb) => {
      if (validationSchema) {
        const error = validatePayload(req.body, validationSchema);

        if (error) {
          return cb(createError(StatusCodes.BAD_REQUEST, { details: error }));
        }
      }

      if (allowedImageTypes && !allowedImageTypes.includes(file.mimetype)) {
        return cb(
          createError(
            StatusCodes.BAD_REQUEST,
            `Only images with ${allowedImageTypes} mime types are allowed`
          )
        );
      }
      cb(null, true);
    },
    limits: {
      fileSize: maxFileSizeInMBs * 1024 * 1024,
    },
  }).single(fieldName);

  return function (req, res, next) {
    fileUploader(req, res, function (err) {
      if (!err) {
        return next();
      } else if (err instanceof multer.MulterError) {
        err.statusCode = StatusCodes.BAD_REQUEST;
      }
      next(err);
    });
  };
};

module.exports.multerMultipleFilesUploader = function (filesUploadConfigs) {
  const {
    fields,
    destinationFolder,
    allowedImageTypes,
    maxFileSizeInMBs,
    validationSchema,
  } = filesUploadConfigs;

  const filesUploader = multer({
    storage: getMulterS3Storage(destinationFolder),
    fileFilter: (req, file, cb) => {
      if (validationSchema) {
        const error = validatePayload(req.body, validationSchema);

        if (error) {
          return cb(createError(StatusCodes.BAD_REQUEST, { details: error }));
        }
      }

      if (allowedImageTypes && !allowedImageTypes.includes(file.mimetype)) {
        return cb(
          createError(
            StatusCodes.BAD_REQUEST,
            `Only images with ${allowedImageTypes} mime types are allowed`
          )
        );
      }
      cb(null, true);
    },
    limits: {
      fileSize: maxFileSizeInMBs * 1024 * 1024,
    },
  }).fields(fields);

  return function (req, res, next) {
    filesUploader(req, res, function (err) {
      if (!err) {
        return next();
      } else if (err instanceof multer.MulterError) {
        err.statusCode = StatusCodes.BAD_REQUEST;
      }
      next(err);
    });
  };
};

module.exports.multerArrayFileUploader = function (fileUploadConfigs) {
  const {
    fieldName,
    destinationFolder,
    allowedImageTypes,
    maxFileSizeInMBs,
    validationSchema,
    maxCount,
  } = fileUploadConfigs;

  const fileUploader = multer({
    storage: getMulterS3Storage(destinationFolder),
    fileFilter: (req, file, cb) => {
      if (validationSchema) {
        const error = validatePayload(
          req.body.data || req.body,
          validationSchema
        );
        if (error) {
          return cb(createError(StatusCodes.BAD_REQUEST, { details: error }));
        }
      }

      if (!allowedImageTypes.includes(file.mimetype)) {
        return cb(
          createError(
            StatusCodes.BAD_REQUEST,
            `Only images with ${allowedImageTypes} mime types are allowed`
          )
        );
      }
      cb(null, true);
    },
    limits: {
      fileSize: maxFileSizeInMBs * 1024 * 1024,
    },
  }).array(fieldName, maxCount);

  return function (req, res, next) {
    fileUploader(req, res, function (err) {
      if (!err) {
        return next();
      } else if (err instanceof multer.MulterError) {
        err.statusCode = StatusCodes.BAD_REQUEST;
      }
      next(err);
    });
  };
};
