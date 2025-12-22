const { verifyEthSign } = require("./crypto.util");

exports.signCheckBody = async function (req, res, next) {
  try {
    const { sign, walletAddress } = req.body;

    const bool = await verifyEthSign(walletAddress, sign);

    console.log(
      "process.env.SKIP_SIGN_CHECK",
      !bool,
      !process.env.SKIP_SIGN_CHECK
    );

    if (!bool && !process.env.SKIP_SIGN_CHECK) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid Signature",
        data: null,
      });
    }
    next();
  } catch (ex) {
    next(ex);
  }
};
