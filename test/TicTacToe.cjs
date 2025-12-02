// test code will verify three main things:
// 1. the contract deploys successfully
// 2. playerX is set to the address that deployed the contract
// 3. nextPlayer is correctly initialized to playerX

// import the necessary tools from hardhat
const { expect } = require("chai");
// ethers.js is used to interact with the Ethereum blockchain and smart contracts
const { ethers } = require("hardhat");

describe("TicTacToe", function () {
  let ticTacToe; // Variable to hold the deployed contract instance
  let deployer;  // Player X
  let playerO;   // Player O

  // 2. The 'beforeEach' Hook: Deploys a new contract instance before every test
  beforeEach(async function () {
    // Get the signers (test accounts) provided by Hardhat
    [ deployer, playerO ] = await ethers.getSigners();

    // Get the ContractFactory for the TicTacToe contract
    const TicTacToeFactory = await ethers.getContractFactory("TicTacToe");

    // Deploy the contract, passing Player O's address to the constructor
    // The deployer automatically becomes Player X (msg.sender)
    ticTacToe = await TicTacToeFactory.deploy(playerO.address);

    // later hardhat versions may require awaiting deployment completion, as .deployed() no longer includes that
    // await ticTacToe.deployed();
    await ticTacToe.waitForDeployment();
  });

  // 3. Test Cases (It blocks)
  it("Should set the deployer as Player X and initialize the turn", async function () {
    // Check 1: Verify Player X is the address that deployed the contract
    // We call the public 'playerX' state variable function on the contract instance
    expect(await ticTacToe.playerX()).to.equal(deployer.address);

    // Check 2: Verify Player O is the address passed to the constructor
    expect(await ticTacToe.playerO()).to.equal(playerO.address);

    // Check 3: Verify Player X starts the game (nextPlayer == playerX)
    expect(await ticTacToe.nextPlayer()).to.equal(deployer.address);
  });

  it("Should initialize the board to all zeros (empty)", async function () {
    // Check 4: Verify a cell is empty (should return 0)
    // Because 'board' is public, we call it like a function: board(row, col)
    expect(await ticTacToe.board(0, 0)).to.equal(0);
    expect(await ticTacToe.board(2, 2)).to.equal(0);
  });

  // 4. Test Case for the REQUIRE statement in the constructor
  it("Should revert if Player X tries to deploy the game with themselves as Player O", async function () {
    const TicTacToeFactory = await ethers.getContractFactory("TicTacToe");

    // We expect the deployment to fail (revert) because playerX == playerO
    await expect(
      TicTacToeFactory.deploy(deployer.address) // Deploying with deployer's address as Player O
    ).to.be.revertedWith("Player O must be a different address.");
  });
});
