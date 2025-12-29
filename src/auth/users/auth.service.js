const usersService = require("../../users/users.service");
const { JWT_TOKEN_TYPES } = require("../../../helpers/constants");
const JWT = require("../../common/auth/jwt");
const redisClient = require("../../../helpers/redis");

exports.signup = async (signupDto, result = {}) => {
  try {
    const { displayName } = signupDto;
    const response = await usersService.create({
      ...signupDto,
      userName: displayName.toLowerCase(),
    });

    if (response.ex) throw response.ex;

    if (response.hasConflict) {
      result = { hasConflict: true, exMessage: response.conflictMessage };
    } else {
      const user = response.data;
      const { accessToken, refreshToken } = await JWT.signTokens({
        id: user._id,
        role: user.role,
      });

      result.data = {
        user,
        accessToken,
        refreshToken,
      };
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.signin = async (signInDto, result = {}) => {
  try {
    const { email, password } = signInDto;
    const response = await usersService.findOne({ email });

    if (response.ex) throw response.ex;

    if (response.notFound) {
      result = {
        isUnauthorized: true,
        exMessage: "Email or Password is incorrect",
      };
    } else {
      const user = response.data;
      const isPasswordValid = await user.isPasswordValid(password);

      if (!isPasswordValid) {
        result = {
          isUnauthorized: true,
          exMessage: "Email or Password is incorrect",
        };
      } else {
        const user = response.data;
        const { accessToken, refreshToken } = await JWT.signTokens({
          id: user._id,
          role: user.role,
        });

        result.data = {
          user,
          accessToken,
          refreshToken,
        };
      }
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.refreshToken = async (refreshTokenDto, result = {}) => {
  try {
    const { userId } = refreshTokenDto;

    const response = await usersService.findById(userId);

    if (response.ex) throw response.ex;

    if (!response.data) {
      result.userNotFound = true;
    } else {
      // generate access token
      const accessToken = await JWT.signToken(
        {
          id: response.data._id,
          role: response.data.role,
        },
        JWT_TOKEN_TYPES.ACCESS_TOKEN
      );

      result.data = {
        accessToken,
      };
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.logout = async (logoutDto, result = {}) => {
  try {
    const { userId } = logoutDto;
    const res = await redisClient.del(userId);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.forgetPassword = async (forgetPasswordDto, result = {}) => {
  try {
    const { email } = forgetPasswordDto;

    const response = await usersService.findOne({ email });

    if (response.ex) throw response.ex;

    if (!response.data) {
      result = {
        notFound: true,
        exMessage: "User with email does not exists",
      };
    } else {
      result.userExist = true;
      const user = response.data;
      user.passwordResetToken = await JWT.signPasswordResetToken();
      await user.save();

      // const passwordResetLink = `${configs.frontEndUrl}/reset-password?token=${user.passwordResetToken}`;

      // eventEmitter.emit(USERS_EVENTS.FORGOT_PASSWORD, {
      //   receiverEmail: user.email,
      //   name: user.name,
      //   passwordResetLink,
      // });
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.resetPassword = async (resetPasswordDto, result = {}) => {
  try {
    const response = await usersService.resetPassword(resetPasswordDto);

    if (response.ex) throw response.ex;

    if (response.userNotExist) {
      result = response;
    } else {
      result = response;

      // eventEmitter.emit(USERS_EVENTS.PASSWORD_UPDATE, {
      //   receiverEmail: response.data.email,
      //   name: response.data.name,
      // });
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
