// contracts/TicTacToe.sol

// Specifies the Solidity compiler version
pragma solidity ^0.8.0;

contract TicTacToe {
    // === STATE VARIABLES (Permanent data stored on the blockchain) ===

    // 1. Game Board: 3x3 array
    // 0: Empty, 1: Player X, 2: Player O
    uint8[3][3] public board;

    // 2. Player Addresses
    address payable public playerX;
    address payable public playerO;

    // 3. Game Flow
    address public nextPlayer; // Whose turn it is
    bool public isGameOver; // Is the game finished?

    // === CONSTRUCTOR (Runs ONLY once upon deployment) ===
    constructor(address payable _playerO) {
        // msg.sender is the address that deployed the contract (Player X)
        playerX = payable(msg.sender);

        // REQUIRE: Fails the deployment if Player X and Player O are the same
        require(playerX != _playerO, "Player O must be a different address.");
        playerO = _playerO;

        nextPlayer = playerX; // Player X (deployer) starts first
        isGameOver = false;
    }
}
