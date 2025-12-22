module.exports = {
  MESSAGE_TYPES: {
    TEXT: "text",
    IMAGE: "image",
    VIDEO: "video",
    FILE: "file",
    REQUEST: "request",
    PAYMENT: "payment",
    GIFT: "gift",
    NFT: "nft",
    LINK: "link",
    AUDIO: "audio",
    IMAGE_GROUP: "image-group",
    ESCROW: "escrow",
    INFO: "info",
  },
  GROUP_TYPES: {
    PUBLIC: "public",
    PRIVATE: "private",
    PREMIUM: "premium",
  },
  COLLECTION_TYPES: {
    PUBLIC: "public",
    PRIVATE: "private",
    PREMIUM: "premium",
  },
  MESSAGE_STATUS: {
    SENT: "sent",
    DELIVERED: "delivered",
    READ: "read",
  },

  VIEW_TYPE: {
    STANDARD: "standard",
    ONE_TIME_VIEW: "one-time-view",
  },
  VIEW_STATUS: {
    OPENED: "opened",
    UNOPENED: "unopened",
    NULL: null,
  },
  DELETE_TYPE: {
    DELETE_FOR_ME: "delete for me",
    DELETE_FOR_EVERYONE: "delete for everyone",
  },
  MESSAGE_ACCESS_TYPES: {
    FREE: "free",
    PAID: "paid",
  },
  MUTE_DURATION: {
    EIGHT_HOURS: "8h",
    ONE_WEEK: "1w",
    ALWAYS: "always",
  },
  MESSAGE_TYPE_TEMPLATES: {
    image: "sent you an image",
    video: "sent you a video",
    file: "sent you a file",
    "image-group": "sent you images",
    request: "requested a payment",
    payment: "sent you a payment",
    gift: "sent you a gift",
    nft: "sent you an NFT",
    link: "shared a link",
    audio: "sent you a voice message",
  },
  SUBSCRIPTION_STATUS: {
    ACTIVE: "active",
    INACTIVE: "inactive",
    CANCELLED: "cancelled",
    EXPIRED: "expired",
  },
  SUBSCRIPTION_DURATIONS: {
    NULL: null,
    WEEK: "1 week",
    MONTH: "1 month",
    YEAR: "1 year",
    ONE_TIME: "one-time",
  },

  DISSAPEARING_DURATIONS: {
    NULL: null,
    ONE_DAY: "24 hours",
    SEVEN_DAYS: "7 days",
    NINETY_DAYS: "90 days",
  },
  PIN_DURATIONS: {
    ONE_DAY: "24 hours",
    SEVEN_DAYS: "7 days",
    THIRTY_DAYS: "30 days",
  },
};
