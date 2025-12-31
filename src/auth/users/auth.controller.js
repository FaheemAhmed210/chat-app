const { StatusCodes } = require("http-status-codes");
const authService = require("./auth.service.js");
const {
  handleServiceResult,
} = require("../../common/errors/handle-service-result.js");

exports.signup = async (req, res, next) => {
  try {
    const signupDto = req.body;

    const result = await authService.signup(signupDto);

    const data = handleServiceResult(result);

    return res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Signup Successful",
      data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.signin = async (req, res, next) => {
  try {
    const signInDto = req.body;

    const result = await authService.signin(signInDto);

    const data = handleServiceResult(result);

    return res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Signin Successful",
      data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const refreshTokenDto = req.user;

    const result = await authService.refreshToken(refreshTokenDto);

    const data = handleServiceResult(result);

    return res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      messages: "Access Token creation successful",
      data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const logoutDto = {
      userId: req.user.id,
    };
    const result = await authService.logout(logoutDto);

    const data = handleServiceResult(result);

    return res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      messages: "Logout Successful",
      data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.forgetPassword = async (req, res, next) => {
  try {
    const forgetPasswordDto = {
      ...req.body,
    };
    const result = await authService.forgetPassword(forgetPasswordDto);

    const data = handleServiceResult(result);

    return res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Password reset link sent via email",
    });
  } catch (ex) {
    next(ex);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const resetPasswordDto = {
      passwordResetToken: token,
      password,
    };
    const result = await authService.resetPassword(resetPasswordDto);
    const data = handleServiceResult(result);

    return res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Your Password has been successfuly changed.",
    });
  } catch (ex) {
    next(ex);
  }
};
