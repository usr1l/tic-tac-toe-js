// this is a compiler directive, dictates that the source file must be compiled with Solidity version 0.8.0 or higher
pragma solidity ^0.8.0;

// contracts are a class and the basic building block of solidity applications
// bundles together state variables (data) and functions (behavior/logic) that can interact with that data
// becomes immutable once deployed to the blockchain
contract TicTacToe {
    // STATE VARIABLES (variables that hold the state of the contract/permanently stored on the blockchain)

    // and unsigned integer (non-negative) that use 8 bits of storage, represents the board as a 3x3 grid
    // public is a visibility specifier/modifier, automatically creates a "getter" or "view" function for the variable
    // public allows viewing of state vairable without spending gas
    uint8[3][3] public board;

    // adress: the standard data type for a 20-byte ehtereum address
    // payable: a modifier keyword to indicate that this address is capable of receiving ether, important for games with stakes
    address payable public playerX;
    address payable public playerO;
    address public nextPlayer;
    bool public isGameOver;

    // CONSTRUCTOR runs only once upon deployment of the contract
    // this constructor takes one argument, the address of playerO, underscore before the name is a common convention for function parameters
    constructor(address payable _playerO) {
        // msg.sender is a global variable (or builtin) that always holds the address the account or contract that initiated the current transaction
        // think of it like this: playerX is the address that deploys the contract, the argument entered into constructor is playerO, and is passed in during the deployment
        playerX = payable(msg.sender);

        // essential security check and error handling mechanism to in Solidity
        // REQUIRE: checks that playerX and playerO are different addresses, if not, it throws and error and reverts the transaction, gas spent is refunded
        require(playerX != _playerO, "Player O must be a different address.");
        playerO = _playerO;

        // initializes nextPlayer to playerX, meaning playerX will make the first move
        nextPlayer = playerX;
        isGameOver = false;
    }
}
