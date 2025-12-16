// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TicTacToe.sol";

contract TicTacToeFactory {
    address[] public deployedGames;

    event GameCreated(address gameAddress, address playerX, address playerO);

    function createNewGame(address payable _playerO) public {
        require(msg.sender != _playerO, "Can't play against yourself.");

        TicTacToe newGame = new TicTacToe();
        newGame.initialize(payable (msg.sender), _playerO);

        deployedGames.push(address(newGame));
        emit GameCreated(address(newGame), msg.sender, _playerO);
    }


}
