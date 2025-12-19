# ⚔️ Web3 Real-Time Tic-Tac-Toe

A decentralized multiplayer game featuring a **Hybrid Web3 Architecture**. This project leverages **Socket.io** and **Solidity Smart Contracts** on the Ethereum network for game verification.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Socket.io](https://img.shields.io/badge/Socket.io-black?logo=socketdotio&logoColor=white)
![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?logo=ethereum&logoColor=white)

---

## 🚀 Live Production Environment
* **Frontend UI:** [tictactoe-smartcontract.netlify.app](https://tictactoe-smartcontract.netlify.app)
* **Real-Time Engine (API):** [tictactoe-server-rooms.fly.dev](https://tictactoe-server-rooms.fly.dev)
* **Network:** Ethereum Sepolia Testnet

---

## 🎮 Getting Started (How to Play)

To participate in a match, ensure you have the **MetaMask** extension installed and your browser set to the **Sepolia Test Network**.

### 1. Configure Your Wallet
* **Network:** Switch MetaMask to the **Sepolia Test Network**.
* **Gas:** You will need test ETH to sign moves. You can obtain some from a [Sepolia Faucet](https://sepoliafaucet.com/).

### 2. Enter the Lobby
1.  Navigate to the [Live Demo](https://tictactoe-smartcontract.netlify.app).
2.  Connect your wallet and select your wallet account.

### 3. Matchmaking
* **Create a Room:** Click **"Create Room"** to generate a unique 6-digit **Hex Code** (e.g., `bf3a12`). This creates a private namespace on the server.
* **Join a Room:** Paste your opponent's Hex Code into the input field and click **"Join Room"**.

### 4. Gameplay & On-Chain Settlement
1.  **The Handshake:** The room creator initiates the **Smart Contract Deployment**. You must sign the transaction to deploy your specific game instance to the blockchain.
2.  **Taking a Turn:** Click any empty square. This initiates a `makeMove` transaction via Ethers.js.
3.  **Real-Time Sync:** While the block is mining, the UI will enter a **"Transacting"** state via Sockets to notify your opponent.
4.  **Finality:** Once the transaction is confirmed, the board updates globally. The first player to align three symbols triggers the `claimVictory` logic to finalize the match result on-chain.

## 🏗️ Technical Architecture

### 1. The Real-Time Layer (Socket.io)
The backend, hosted on **Fly.io**, manages the server chat rooms and game updates. This includes:
* **Room Management:** Matchmaking via unique Hex IDs.

```javascript
function handleCreateRoom(socket, data) {
    const roomId = crypto.randomBytes(3).toString('hex');
    const { userAddress } = data;

    const room = {
        creator: userAddress,
        joiner: null,
        status: 'WAITING',
        creatorSocketId: socket.id,
        joinerSocketId: null,
        gameContractAddress: null
    };

    rooms[ roomId ] = room;

    socket.join(roomId);
    socket.emit('roomCreated', { roomId, creator: userAddress });
    const message = `[SYSTEM]: Room ${roomId} created. Waiting for opponent to join...`;

    io.to(roomId).emit('announcement', { sender: 'SYSTEM', message, timestamp: Date.now() });
}
```

* **Instant Synchronization:** Move broadcasting and real-time chat.
```javascript
io.on('connection', socket => {
    socket.on('createRoom', data => handleCreateRoom(socket, data));
    socket.on('joinRoom', data => handleJoinRoom(socket, data));
    socket.on('startGame', data => handleStartGame(socket, data));
    socket.on('chatMessage', data => handleChatMessage(socket, data));
    socket.on('deployFail', data => handleDeployFail(socket, data));
    socket.on('deploySuccess', data => handleDeploySuccess(socket, data));
    socket.on('submitMove', data => handleSubmitMove(socket, data));
    socket.on('moveFail', data => handleMoveFail(socket, data));
    socket.on('moveSuccess', data => handleMoveSuccess(socket, data));
    socket.on('restartGame', data => handleRestartGame(socket, data));
    socket.on('leaveRoom', data => handleLeaveRoom(socket, data));
    socket.on('transacting', data => handleTransacting(socket, data));
    socket.on('disconnecting', () => {
        const joinedRooms = Array.from(socket.rooms);
        const gameRoomId = joinedRooms.find(id => rooms[ id ]);
        if (gameRoomId) {
            const room = rooms[ gameRoomId ];
            const isCreator = room.creatorSocketId === socket.id;
            handleLeaveRoom(socket, { roomId: gameRoomId, isCreator });
        }
    });
})
```
### 2. The Trust & Settlement Layer (Solidity/EVM)
The blockchain serves as a validator. While the frontend provides a reactive simulation of the game, the **Smart Contract Factory** governs the absolute truth:
* **Initialization:** The `TicTacToeFactory` contract binds player addresses to a unique, deployed contract instance.

* **On-Chain Validation:** The contract re-verifies every move submitted via `handleMakeMove()`. It enforces turn-based execution and validates winning patterns directly on the EVM, making the game immune to client-side code manipulation.

```javascript
export default function Lobby() {

    ...

    const handleMakeMove = async (r, c) => {
        if (gameStatus !== 'ACTIVE' || !gameAddress || !gameContract) {
            addChatMessage({ sender: 'SYSTEM', message: '[ERROR]: Game is not active or contract not ready.', timestamp: Date.now() });
            return;
        };
        socket.emit('transacting', { roomId });
        socket.emit('submitMove', { roomId, r, c, walletAddress });
        try {
            // this calls the contract from the smart contract
            const tx = await gameContract.makeMove(r, c);
            // this waits for the transaction to be mined
            await tx.wait();

            const nextPlayer = await gameContract.nextPlayer();
            const board = await gameContract.getBoardState();
            const newBoard = board.map(row =>
                row.map(cell => Number(cell))
            );

            let winner = null;
            const isGameOver = await gameContract.isGameOver();

            if (isGameOver) {
                winner = await gameContract.winner();
            };

            socket.emit('moveSuccess', { roomId, r, c, walletAddress, nextPlayer, newBoard, winner });
        } catch (e) {
            socket.emit('moveFail', { roomId });
            setGameStatus('ACTIVE');
            return false;
        };
    };

    ...

};
```

* **Immutable Result Settlement:** Once a terminal state (Win/Draw) is reached, the result is permanently etched into the ledger, providing a transparent and verifiable match history.

---

## 📜 Smart Contract Overview

The core logic of the game uses a Smart Contract Factory pattern.

```solidity
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

contract TicTacToe {

    ...

    function initialize(address payable _playerX, address payable _playerO) public {
        require(playerX == address(0), "Game already initialized");
        playerX = _playerX;

        require(_playerO != playerX, "Other player must use a different address");
        playerO = _playerO;

        nextPlayer = playerX;
        isGameOver = false;

        // points to this contract address
        emit GameStarted(address(this), playerX, playerO);
    }
}
```
### Contract Details
| Feature | Implementation |
| :--- | :--- |
| **Factory Contract** | Manages the deployment of new individual game sessions. |
| **Game Contract** | Stores the 3x3 grid state and validates `nextPlayer` logic. |
| **Language** | Solidity ^0.8.19 |
| **Provider** | Ethers.js v6 |

### Core Functions
* `createNewGame(address opponent)`: Triggered by the room creator to deploy a new game instance.
* `makeMove(uint8 row, uint8 col)`: Validates turn-based logic and updates the on-chain board state.
```solidity
    function makeMove(uint8 row, uint8 col) public {
        // ensure the game is not over yet
        require(!isGameOver, "The game is over.");

        // ensure that only the current player can move
        require(msg.sender == nextPlayer, "It's not your turn.");

        // ensure coordinates (player moves) are valid and within bounds
        require(row < 3 && col < 3, "Invalid row or column placement");

        // ensure the selected cell is empty
        require(board[row][col] == 0, "Cell is already taken.");

        // execute the move
        if (msg.sender == playerX) {
            board[row][col] = 1;
        } else {
            board[row][col] = 2;
        }

        // update the gamestate
        checkWin();
        if (!isGameOver) switchTurn();
    }
```
* `isGameOver()`: Checks for winning patterns or stalemates.
```solidity
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
        for (uint8 i = 0; i < board.length; i++) {
            for (uint8 j = 0; j < board[i].length; j++) {
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
```

---

## 🌐 Deployment Infrastructure

### Backend (Fly.io)
The Node.js server is containerized and scaled on Fly.io's global edge network.

### Frontend (Netlify)
The React application is deployed as a static site with continuous integration.


---

## 📄 License
Distributed under the MIT License.
