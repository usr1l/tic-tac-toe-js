require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
console.log("Loaded RPC URL:", process.env.SEPOLIA_RPC_URL);

module.exports = {
  // define the solidity compiler version
  solidity: "0.8.28",

  // add any other configuration details here
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [ PRIVATE_KEY ]
    },
  }
};
