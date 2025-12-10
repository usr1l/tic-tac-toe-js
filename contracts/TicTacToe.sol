// SPDX-License-Identifier: MIT
// this is a compiler directive, dictates that the source file must be compiled with Solidity version 0.8.0 or higher
pragma solidity ^0.8.0;


// simple walkthrough:
// create contract
// contracts consist of data types (structs, tuples, arrs, uint, etc.), functions, events and require()
// contracts can be initialized within other contracts, use arr for storing addresses
// events can be created and emitted to communicate with the frontend

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
    // in solodity, when you define a state variable witht the public visibility specfifer, the compiler doesn't just store the variable, it generates a getter function for it
    address payable internal playerX;
    address payable internal playerO;
    address public nextPlayer;
    bool public isGameOver;

    // variable for tracking game winner
    address public winner;

    event GameStarted(address indexed gameAddress, address indexed pX, address indexed pO);
    event MoveMade(address indexed player, uint8 r, uint8 c, uint8 marker);
    event GameEnded(address indexed winner);

    // use initialization function for initializing multiple instances of game contract, instead of the constructor here
    function initialize(address payable _playerX, address payable _playerO) public {
        // crucial for access control check prevents function from being called more than once
        // address(0) before the contract is initialized is set to 20 bytes of 0, after initializing its set to deployer address
        require(playerX == address(0), "Game already initialized");
        playerX = _playerX;

        require(_playerO != playerX, "Other player must use a different address");
        playerO = _playerO;

        nextPlayer = playerX;
        isGameOver = false;

        emit GameStarted(address(this), playerX, playerO);
    }

    // // CONSTRUCTOR runs only once upon deployment of the contract
    // // this constructor takes one argument, the address of playerO, underscore before the name is a common convention for function parameters
    // constructor(address payable _playerO) {
    //     // msg.sender is a global variable (or builtin) that always holds the address the account or contract that initiated the current transaction
    //     // think of it like this: playerX is the address that deploys the contract, the argument entered into constructor is playerO, and is passed in during the deployment
    //     playerX = payable(msg.sender);

    //     // essential security check and error handling mechanism to in Solidity
    //     // REQUIRE: checks that playerX and playerO are different addresses, if not, it throws and error and reverts the transaction, gas spent is refunded
    //     require(playerX != _playerO, "Player O must be a different address.");
    //     playerO = _playerO;

    //     // initializes nextPlayer to playerX, meaning playerX will make the first move
    //     nextPlayer = playerX;
    //     isGameOver = false;
    // }

    // custom getter for functions
    function getPlayers() public view returns (address, address) {
        return (playerX, playerO);
    }

    function getPlayerX() public view returns (address) {
        return playerX;
    }

    function getPlayerO() public view returns (address) {
        return playerO;
    }

    // custom get current board
    function getBoardState() public view returns (uint8[3][3] memory) {
        return board;
    }

    // allow players to make moves
    function makeMove(uint8 row, uint8 col) public {
        // rule checks using require

        // ensure the game is not over yet
        require(!isGameOver, "The game is over.");

        // ensure that only the current player can move
        require(msg.sender == nextPlayer, "It's not your turn.");

        // ensure coordinates (player moves) are valid and within bounds
        require(row < 3 && col < 3, "Invalid row or column placement");

        // ensure the selected cell is empty
        require(board[row][col] == 0, "Cell is already taken.");

        // execute the move
        // assign the correct player's marker
        if (msg.sender == playerX) {
            board[row][col] = 1;
        } else {
            board[row][col] = 2;
        }

        // update the gamestate
        checkWin();
        if (!isGameOver) switchTurn();
    }

    // private makes it so that only function within this contract can call it
    // internal is simimlar to private, but allows inheritance, i.e. child contracts to access it, or inherited contracts
    function switchTurn() private {
        nextPlayer == playerX ? nextPlayer = playerO : nextPlayer = playerX;
    }

    function endGameWithWinner() private {
        isGameOver = true;
        winner = msg.sender;
        emit GameEnded(winner);
    }

    function checkWin() private {
        // find the marker of the player who just made a move
        uint8 marker;
        if (msg.sender == playerX) {
            marker = 1;
        } else {
            marker = 2;
        }


        // check for rows, columns, and diagonals win condition
        for (uint8 i = 0; i < 3; i++) {
            if (board[i][0] == marker && board[i][1] == marker && board[i][2] == marker) {
                return endGameWithWinner();
            }
            if (board[0][i] == marker && board[1][i] == marker && board[2][i] == marker) {
                return endGameWithWinner();
            }
        }
        if (board[0][0] == marker && board[1][1] == marker && board[2][2] == marker) {
            return endGameWithWinner();
        } else if (board[0][2] == marker && board[1][1] == marker && board[2][0] == marker) {
            return endGameWithWinner();
        }

        // check for draw condition (all cells filled but no winner)
        uint8 filledCells = 0;
        for (uint i = 0; i < 3; i++) {
            for (uint8 j = 0; j < 3; j++) {
                if (board[i][j] != 0) filledCells++;
            }
        }
        // if all cells are filled, end the game
        if (filledCells == 9) {
            isGameOver = true;
            winner = address(0);
            emit GameEnded(winner);
        }
    }
}
