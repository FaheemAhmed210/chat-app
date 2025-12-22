module.exports = {
  GROUP_TYPES: {
    PUBLIC: "public",
    PRIVATE: "private",
    PREMIUM: "premium",
  },
  MUTE_DURATION: {
    NEVER: "never",
    EIGHT_HOURS: "8h",
    ONE_WEEK: "1w",
    ALWAYS: "always",
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

  GROUP_MESSAGE_TYPES: {
    TEXT: "text",
    IMAGE: "image",
    VIDEO: "video",
    FILE: "file",
    LINK: "link",
    AUDIO: "audio",
    IMAGE_GROUP: "image-group",
    INFO: "info",
  },
  MESSAGE_TYPE_TEMPLATES: {
    image: "sent you an image",
    video: "sent you a video",
    file: "sent you a file",
    "image-group": "sent you images",
    link: "shared a link",
    audio: "sent you a voice message",
  },
  MESSAGE_STATUS: {
    SENT: "all sent",
    DELIVERED: "all delivered",
    READ: "all read",
  },
  UPATE_MESSAGE_STATUS: {
    SENT: "sent",
    DELIVERED: "delivered",
    READ: "read",
  },

  MESSAGE_ACCESS_TYPES: {
    FREE: "free",
    PAID: "paid",
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
  DELETE_TYPE: {
    DELETE_FOR_ME: "delete for me",
    DELETE_FOR_EVERYONE: "delete for everyone",
  },
};
