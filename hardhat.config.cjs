require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition/config");
require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;


const config = {
  // define the solidity compiler version
  solidity: "0.8.28",

  // add any other configuration details here
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [ PRIVATE_KEY ]
    },
    ignition: {}
  }
};

export default config;
