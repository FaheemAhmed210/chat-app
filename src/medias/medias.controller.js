const { StatusCodes } = require("http-status-codes");
const cloudfrontUtil = require("../common/aws/cloudfront/cloudfront.util");

const meidasService = require("./medias.service");
const configs = require("../../configs");
const { removeMultipleFile } = require("../common/aws/s3/s3.util");

exports.uploadImage = async (req, res, next) => {
  try {
    const { key } = req.file;

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.OK,
      message: "Media Upload Successfully",
      data: {
        url: cloudfrontUtil.getCloudFrontUriFromKey(key),
        originalname: req.file.originalname,
        contentType: req.file.contentType,
        size: req.file.size,
      },
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.initializeMultipartUpload = async (req, res, next) => {
  try {
    const initMultipartUploadDto = req.body;

    const result = await meidasService.initializeMultipartUpload(
      initMultipartUploadDto
    );
    if (result.ex) throw result.ex;

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Multipart upload initialized successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.createPresignedUrlsForParts = async (req, res, next) => {
  try {
    const createPresignedUrlsForPartsDto = req.body;

    const result = await meidasService.createPresignedUrlsForParts(
      createPresignedUrlsForPartsDto
    );
    if (result.ex) throw result.ex;

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Presigned parts urls created successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.finalizeMultipartUpload = async (req, res, next) => {
  try {
    const finalizeMultipartUploadDto = req.body;

    const result = await meidasService.finalizeMultipartUpload(
      finalizeMultipartUploadDto
    );
    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Multipart upload completed successfuly",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.deleteMultipleMedia = async (req, res, next) => {
  try {
    const { url } = req.body;

    // const key = extractCloudFrontKeysFromUrlArray(url);

    // if (key.includes("placeholders")) {
    //   return res.status(StatusCodes.OK).json({
    //     message: "Image deletion ignored as it is default profile image.",
    //   });
    // }
    const result = await removeMultipleFile(url);
    // if (result.ex) throw result.ex;
    res.status(StatusCodes.OK).json({
      message: "Delete Successfully",
    });
  } catch (ex) {
    next(ex);
  }
};
