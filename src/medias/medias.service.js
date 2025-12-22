const configs = require("../../configs");
const {
  CreateMultipartUpload,
  createPresignedUrlsForParts,
  finalizeMultipartUpload,
} = require("../common/aws/s3/s3.util");
const _ = require("lodash");
const cloudfrontUtil = require("../common/aws/cloudfront/cloudfront.util");

module.exports.initializeMultipartUpload = async (
  initMultipartUploadDto,
  result = {}
) => {
  try {
    const { destination, fileName } = initMultipartUploadDto;

    const multipartUpload = await CreateMultipartUpload(
      `${destination}/${fileName}`
    );
    result.data = multipartUpload;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

module.exports.createPresignedUrlsForParts = async (
  createPresignedUrlsForPartsDto,
  result = {}
) => {
  try {
    const partSignedUrlList = await createPresignedUrlsForParts(
      createPresignedUrlsForPartsDto
    );

    result.data = {
      parts: partSignedUrlList,
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

module.exports.finalizeMultipartUpload = async (
  finalizeMultipartUploadDto,
  result = {}
) => {
  try {
    const completeMultipartUploadOutput = await finalizeMultipartUpload(
      finalizeMultipartUploadDto
    );

    result.data = {
      fileUrl: cloudfrontUtil.getCloudFrontUriFromKey(
        completeMultipartUploadOutput.Key
      ),
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
