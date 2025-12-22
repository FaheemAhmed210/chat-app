const configs = require("../../../configs");
const jwt = require("jsonwebtoken");
const { JWT_TOKEN_TYPES } = require("../../../helpers/constants");
const createError = require("http-errors");
const { StatusCodes } = require("http-status-codes");

verifyToken = (token, secret) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, payload) => {
      if (err) {
        const message =
          err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        reject(createError(StatusCodes.UNAUTHORIZED, message));
        return;
      }
      resolve({ payload });
    });
  });
};

exports.signToken = (user, type) => {
  return new Promise((resolve, reject) => {
    const secret =
      type === JWT_TOKEN_TYPES.ACCESS_TOKEN
        ? configs.jwt.accessToken.secret
        : configs.jwt.refreshToken.secret;
    let expiry;

    expiry =
      type === JWT_TOKEN_TYPES.ACCESS_TOKEN
        ? configs.jwt.accessToken.ttl
        : configs.jwt.refreshToken.ttl;

    const options = {
      expiresIn: expiry,
      issuer: configs.jwt.issuer,
      audience: user.id.toString(),
      subject: user.id.toString(),
    };

    const payload = type === JWT_TOKEN_TYPES.ACCESS_TOKEN ? user : {};

    jwt.sign(payload, secret, options, (err, token) => {
      if (err) {
        // log exception here
        reject(createError.InternalServerError());
        return;
      }
      resolve(token);
    });
  });
};

exports.verifyAccessToken = async (req, res, next) => {
  try {
    if (!req.headers["authorization"]) return next(createError.Unauthorized());

    const authHeader = req.headers["authorization"];
    const bearerToken = authHeader.split(" ");

    const token = bearerToken[1];

    const { payload } = await verifyToken(
      token,
      configs.jwt.accessToken.secret
    );

    req.user = payload;
    next();
  } catch (ex) {
    next(ex);
  }
};

exports.verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const { payload } = await verifyToken(
      refreshToken,
      configs.jwt.refreshToken.secret
    );

    const userId = payload.aud;
    // const result = await sessionsService.getToken(userId, refreshToken);

    // if (result) {
    req.user = { userId };
    next();
    // } else {
    //   throw createError(StatusCodes.UNAUTHORIZED, "Invalid Refresh Token");
    // }
  } catch (ex) {
    next(ex);
  }
};

exports.signPasswordResetToken = () => {
  return new Promise((resolve, reject) => {
    const secret = configs.jwt.passwordResetToken.secret;
    const expiry = configs.jwt.passwordResetToken.ttl;

    const options = {
      expiresIn: expiry,
      issuer: configs.jwt.issuer,
    };

    const payload = {};

    jwt.sign(payload, secret, options, (err, token) => {
      if (err) {
        // log exception here
        reject(createError.InternalServerError());
        return;
      }
      resolve(token);
    });
  });
};

exports.verifySocketToken = (socket, next) => {
  const token = socket.handshake.auth.token;

  jwt.verify(token, configs.jwt.accessToken.secret, (err, payload) => {
    if (err) {
      const message =
        err.name === "TokenExpiredError"
          ? "Password Reset Token Expired"
          : err.message;
      return next(new Error(message));
    }

    socket.userId = payload.id;
    next();
  });
};

exports.verifyPasswordResetToken = (req, res, next) => {
  const { token } = req.body;

  jwt.verify(token, configs.jwt.passwordResetToken.secret, (err, payload) => {
    if (err) {
      const message =
        err.name === "TokenExpiredError"
          ? "Password Reset Token Expired"
          : err.message;
      return res.status(StatusCodes.GONE).json({
        statusCode: StatusCodes.GONE,
        title: "Password Reset Token Expired",
        message,
      });
    }
    req.user = payload;
    next();
  });
};
