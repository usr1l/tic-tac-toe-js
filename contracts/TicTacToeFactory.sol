// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TicTacToe.sol";

contract TicTacToeFactory {
    address[] public deployedGames;

    event GameCreated(address gameAddress, address playerX, address playerO);

    function createNewGame(address) public {

    }

}