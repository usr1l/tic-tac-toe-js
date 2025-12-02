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

  it("Should allow a player to make a move and switch turns", async function () {
    // playerX (deployer) makes the first move
    const startingPlayer = deployer.address;
    const nextTurnPlayer = playerO.address;

    // playerX makes a move at (0, 0)
    await ticTacToe.makeMove(0, 0);

    // check if the board was updated correctly (0, 0) should be marked with 1
    expect(await ticTacToe.board(0, 0)).to.equal(1);

    // verify if the turn has switched to playerO
    expect(await ticTacToe.nextPlayer()).to.equal(nextTurnPlayer);

    // playerO makes a move at (1, 1)
    // in Ethers.js (hardhat uses to interact with your contracts), .connect() is used to change the ideentity of the account that will sign and send a transaction
    // it tells the contract, "for this next transaction, act as this specific user"
    // think of smart contract function calls as writing checks from different bank accounts
    // when you sign a function without .connect(), its like the default hardhat account (playerX in this case) is writing the check
    // when you use .connect(playerO), its like playerO is writing the check instead
    await ticTacToe.connect(playerO).makeMove(1, 1);

    //  check if the board was correctly updated, (1, 1) should be marked with 2
    expect(await ticTacToe.board(1, 1)).to.equal(2);

    expect(await ticTacToe.nextPlayer().to.equal(startingPlayer));
  });
});
