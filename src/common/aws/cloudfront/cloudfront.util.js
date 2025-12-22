const configs = require('../../../../configs');

module.exports.getCloudFrontUriFromKey = (key) => {
  return `${configs.aws.cloudfront.baseUrl}/${key}`;
}