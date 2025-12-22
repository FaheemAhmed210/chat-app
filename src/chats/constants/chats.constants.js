module.exports = {
  CHAT_MESSAGE_TYPES: {
    TEXT: "text",
    IMAGE: "image",
    VIDEO: "video",
    FILE: "file",
    LINK: "link",
    AUDIO: "audio",
    IMAGE_GROUP: "image-group",
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
    link: "shared a link",
    audio: "sent you a voice message",
  },
};
