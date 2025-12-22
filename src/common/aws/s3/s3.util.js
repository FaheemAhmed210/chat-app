const {
  S3Client,
  ListBucketsCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} = require("@aws-sdk/client-s3");
const configs = require("../../../../configs");
const _ = require("lodash");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({
  region: configs.aws.s3.bucketRegion,
  credentials: {
    accessKeyId: configs.aws.accessKey,
    secretAccessKey: configs.aws.accessSecret,
  },
});

exports.removeFile = async (fileKey) => {
  try {
    const params = {
      Bucket: configs.aws.s3.bucketName,
      Key: fileKey,
    };

    const data = await s3.send(new DeleteObjectCommand(params));
    return data;
  } catch (err) {
    next(err);
  }
};
exports.removeMultipleFile = async (keys) => {
  const bucketParams = {
    Bucket: configs.aws.s3.bucketName,
    Delete: {
      Objects: extractKeysFromUrlArray(keys),
    },
  };

  try {
    const data = await s3.send(new DeleteObjectsCommand(bucketParams));
    return data; // Return the response from the delete operation
  } catch (err) {
    next(err);
  }
};

exports.extractKeyFromUrl = function (url) {
  return url.split("amazonaws.com/")[1];
};

exports.CreateMultipartUpload = async (filename) => {
  try {
    const params = {
      Bucket: configs.aws.s3.bucketName,
      Key: filename,
    };

    const multipartUpload = await s3.send(
      new CreateMultipartUploadCommand(params)
    );
    return {
      fileId: multipartUpload.UploadId,
      fileKey: multipartUpload.Key,
    };
  } catch (err) {
    next(err);
  }
};

exports.finalizeMultipartUpload = async (finalizeMultipartUploadDto) => {
  try {
    const { fileKey, fileId, parts } = finalizeMultipartUploadDto;

    const multipartParams = {
      Bucket: configs.aws.s3.bucketName,
      Key: fileKey,
      UploadId: fileId,
      MultipartUpload: {
        Parts: _.orderBy(parts, ["PartNumber"], ["asc"]),
      },
    };

    const command = new CompleteMultipartUploadCommand(multipartParams);

    const completeMultipartUploadOutput = await s3.send(command);

    return completeMultipartUploadOutput;
  } catch (err) {
    console.log(err);

    // next(err);
  }
};

exports.createPresignedUrlsForParts = async (
  createPresignedUrlsForPartsDto
) => {
  try {
    const { fileKey, fileId, parts } = createPresignedUrlsForPartsDto;

    const multipartParams = {
      Bucket: configs.aws.s3.bucketName,
      Key: fileKey,
      UploadId: fileId,
    };

    const promises = [];

    for (let index = 0; index < parts; index++) {
      const command = new UploadPartCommand({
        ...multipartParams,
        PartNumber: index + 1,
      });

      const signedUrlPromise = getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
      promises.push(signedUrlPromise);
    }

    const signedUrls = await Promise.all(promises);

    const partSignedUrlList = signedUrls.map((signedUrl, index) => {
      return {
        signedUrl,
        PartNumber: index + 1,
      };
    });
    return partSignedUrlList;
  } catch (err) {
    console.log(err);

    // next(err);
  }
};

extractKeysFromUrlArray = function (urls) {
  return urls.map((url) => ({ Key: url.split("amazonaws.com/")[1] }));
};

exports.s3 = s3;
