const { ethers } = require("ethers");
const configs = require("../configs");
exports.getDecimals = async (tokenAddress, rpcUrl) => {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // ABI fragment for ERC-20 tokens to get the decimals
    const abi = ["function decimals() view returns (uint8)"];

    const contract = new ethers.Contract(tokenAddress, abi, provider);
    return await contract.decimals();
  } catch (ex) {
    console.log(ex);

    return false;
  }
};
