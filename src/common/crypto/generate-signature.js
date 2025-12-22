const { soliditySha3 } = require("web3-utils");
const { Web3 } = require("web3");
const createError = require("http-errors");
const { StatusCodes } = require("http-status-codes");

const { claimsSignerPrivateKey } = require("../../../configs");

exports.getSignedKey = async (getSignedKeyDto) => {
  try {
    const { walletAddress, amount, totalAmount } = getSignedKeyDto;
    const web3 = new Web3();

    const deadline = Math.floor(Date.now() / 1000) + 5 * 60;

    const amountWei = web3.utils.toWei(amount.toString(), "ether");
    const totalAmountWei = web3.utils.toWei(totalAmount.toString(), "ether");

    const soliditySha3Expected = soliditySha3(
      { type: "uint256", value: totalAmountWei },
      { type: "uint256", value: amountWei },
      {
        type: "address",
        value: walletAddress,
      },

      { type: "uint256", value: deadline }
    );

    const signedKey = web3.eth.accounts.sign(
      soliditySha3Expected,
      "0x" + claimsSignerPrivateKey
    );
    r = signedKey.signature.slice(0, 66);
    s = "0x" + signedKey.signature.slice(66, 130);
    v = "0x" + signedKey.signature.slice(130, 132);
    return {
      v: v,
      r: r,
      s: s,
      signedKey: signedKey.signature,
      deadline,
      totalAmount: totalAmountWei,
      amount: amountWei,
      walletAddress,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
  } catch (err) {
    console.log("err::", err);
    throw createError(StatusCodes.BAD_REQUEST, err.message);
  }
};
