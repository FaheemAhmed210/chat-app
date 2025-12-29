module.exports = {
  database: {
    uri: process.env.DATABASE_URI,
  },
  passwordPolicy: {
    minLowercase: 1,
    minUppercase: 1,
    minNumeric: 1,
    minSpecialChars: 1,
    minLength: 8,
  },
  jwt: {
    accessToken: {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      ttl: "1d",
    },
    refreshToken: {
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
      ttl: "7 days",
      redisTTL: 7 * 86400, // 7 days
      redisRemeberMeTTL: 30 * 86400, //days
    },
    issuer: "tomi.com",
  },

  expressRateLimiter: {
    max: 12,
    windowMs: 5000, // 5 seconds
    statusCode: 429,
    message: {
      statusCode: 429,
      message: "Too Many Requests. Please try again in 30 seconds.",
    },
  },
  defaultGroupImage: "https://media.tomi.com/GroupEmpty.png",

  defaultUserImage: "https://media.tomi.com/UserEmpty.png",

  coingecko: {
    baseUrl: process.env.COINGEKO_BASE_URL,
    apiKey: process.env.COINGEKO_API_KEY,
  },
  googleCloud: {
    firebase: {
      serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
      notificationTTL: 60 * 60 * 24,
      batchLimit: 2, //same as firebase limit
    },
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },

  websockets: {
    authTimeoutInMilliSec: 10000,
  },
  aws: {
    accessKey: process.env.AWS_ACCESS_KEY,
    accessSecret: process.env.AWS_ACCESS_SECRET,
    s3: {
      bucketName: process.env.AWS_S3_BUCKET_NAME,
      bucketRegion: process.env.AWS_S3_BUCKET_REGION,
      bucketBaseUrl: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_BUCKET_REGION}.amazonaws.com/`,
    },
    cloudfront: {
      baseUrl: process.env.AWS_S3_CLOUD_FRONT_URL,
    },
  },

  transaction: {
    rpcUrl: process.env.RPC_URL,
    graphUrl: process.env.GRAPH_URL,

    ethereumRpcUrl: process.env.ETHEREUM_RPC_URL,
    ethereumGraphUrl: process.env.ETHEREUM_GRAPH_URL,
  },
  claimsSignerPrivateKey: process.env.CLAIMS_SIGNER,
  secret: process.env.SECRET,
  maxEventListeners: 10,

  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    sender: process.env.SENDGRID_EMAIL_SENDER,
    senderName: process.env.SENDGRID_EMAIL_SENDER_NAME,
    contactusEmailTemplateId:
      process.env.SENDGRID_TOMI_WALLET_CONTACT_US_TEMPLATE_ID,
  },
};
