module.exports = {
  DATABASE_ERROR_CODES: {
    UNIQUE_VIOLATION: 11000,
  },
  DATABASE_ERROR_NAMES: {
    MONGO_SERVER_ERROR: "MongoServerError",
  },
  ROLES: {
    USER: "user",
    ADMIN: "admin",
  },
  REFEREDBY: {
    USER: "user",
  },
  REFFERAL_LEVELS: {
    ZERO: 0,
    ONE: 1,
    TWO: 2,
    THREE: 3,
  },
  TRANSACTION_CHAINS: {
    BSC: "bsc",
    ETHEREUM: "ethereum",
  },

  TRANSACTION_TYPES: {
    TOKENS: "token",
    GIFTS: "gifts",
  },
  SOCKET_EVENTS: {
    CHAT_MESSAGE: "chat_message",
    GROUP_CHAT_MESSAGE: "group_chat_message",
  },
};
