import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TICTACTOE_ABI } from '../../config';
import { io } from 'socket.io-client';
import { ethers } from 'ethers';
import { useWalletProvider } from '../../context/useWalletProvider';
import Game from './Game';
import './Lobby.css';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";
const BOARD = Array(3).fill(null).map(() => Array(3).fill(0));

export default function Lobby() {
    const { walletAddress, factoryContract, walletConnected, signer } = useWalletProvider();

    const [ board, setBoard ] = useState(BOARD);
    const [ isLoaded, setIsLoaded ] = useState(false);
    const [ socket, setSocket ] = useState(null);
    const [ creatorAddress, setCreatorAddress ] = useState(null);
    const [ roomId, setRoomId ] = useState(null);
    const [ opponentAddress, setOpponentAddress ] = useState(null);
    const [ gameAddress, setGameAddress ] = useState(null);
    const [ gameContract, setGameContract ] = useState(null);
    const [ gameWinner, setGameWinner ] = useState(null);

    // 'LOBBY', 'WAITING', 'READY', 'PENDING', 'ACTIVE'
    const [ gameStatus, setGameStatus ] = useState('LOBBY');
    const [ turn, setTurn ] = useState(null);
    const [ joinRoom, setJoinRoom ] = useState('');
    const [ chatMessage, setChatMessage ] = useState('');
    const [ chatHistory, setChatHistory ] = useState([]);

    // using this useref to help with keeping refs to states, or else the websockets useffect
    // will only get references stale variables, as it doesn't update
    // adding variables to the reference array causes the useeffect to rerender multiple times,
    // not the desired effects i
    const signerRef = useRef(signer);
    const creatorRef = useRef(creatorAddress);
    const roomIdRef = useRef(roomId);
    const opponentRef = useRef(opponentAddress);
    const turnRef = useState(turn);
    const boardRef = useState(board);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    // prevents the function from being recreated every render
    const addChatMessage = useCallback(messageObj => {
        setChatHistory(prev => [ ...prev, messageObj ]);
    }, []);

    const isCreator = useMemo(() => {
        if (!walletAddress || !roomId || !factoryContract) return false;

        return gameStatus !== 'LOBBY' && walletAddress.toLowerCase() === creatorAddress.toLowerCase();
    }, [ walletAddress, creatorAddress ]);

    const handleSend = (e) => {
        e.preventDefault();
        if (chatMessage.length > 255) return alert("Message cannot exceed 255 characters.");
        socket.emit("chatMessage", { roomId, sender: walletAddress, message: chatMessage });
        setChatMessage("");
    };

    const handleCreateRoom = (e) => {
        e.preventDefault();
        addChatMessage({ sender: 'SYSTEM', message: 'Creating a room...', timestamp: Date.now() });
        socket.emit("createRoom", { userAddress: walletAddress });
        setGameStatus('WAITING');
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (joinRoom.length !== 6) {
            alert("Room ID must be 6 characters long");
            return;
        }
        socket.emit("joinRoom", { userAddress: walletAddress, roomId: joinRoom })
        setRoomId(joinRoom);
    };

    const handleStartGame = async (e) => {
        e.preventDefault();
        if (walletAddress !== creatorAddress || gameStatus !== 'READY' || !opponentAddress) {
            addChatMessage({ sender: 'SYSTEM', message: '[ERROR]: Cannot start game. Check status and opponent.', timestamp: Date.now() });
            return;
        };

        socket.emit("startGame", { roomId });
        try {
            // call the function
            const tx = await factoryContract.createNewGame(opponentAddress);
            // wait for mining
            const receipt = await tx.wait();
            // extract the deployed contract address from the gamecreated event
            const factoryInterface = factoryContract.interface;
            // find the game created event
            const gameCreatedEvent = receipt.logs.map(log => {
                try {
                    return factoryInterface.parseLog(log);
                } catch (e) {
                    return null;
                };
            }).find(parsedLog => parsedLog && parsedLog.name === "GameCreated");

            if (!gameCreatedEvent) throw new Error("Could not find the GameCreated event");

            // extract the newly created game address

            const newGameAddress = gameCreatedEvent.args[ 0 ];

            if (gameCreatedEvent.args[ 1 ] !== creatorAddress || gameCreatedEvent.args[ 2 ] !== opponentAddress) {
                addChatMessage({
                    sender: 'SYSTEM',
                    message: 'Wallet addresses do not match the deployed contract',
                    timestamp: Date.now
                })
            };

            socket.emit('deploySuccess', { roomId, newGameAddress });
        } catch (e) {
            console.error("Game Start Error:", error);
            socket.emit('deployFail', { roomId })
        };
    };

    const handleMakeMove = async (r, c) => {
        if (gameStatus !== 'ACTIVE' || !gameAddress || !gameContract) {
            addChatMessage({ sender: 'SYSTEM', message: '[ERROR]: Game is not active or contract not ready.', timestamp: Date.now() });
            return;
        };
        socket.emit('transacting', { roomId });
        socket.emit('submitMove', { roomId, r, c, walletAddress });
        try {
            // this waits for the preinstantiated contract
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
            console.log("error: ", e);
            socket.emit('moveFail', { roomId });
            setGameStatus('ACTIVE');
            return false;
        };
    };

    const handleRestartGame = async (e) => {
        e.preventDefault();
        if (!gameContract) return;

        socket.emit('transacting', { roomId });
        try {
            const tx = await gameContract.restartGame();
            await tx.wait();

            const nextPlayer = await gameContract.nextPlayer();

            socket.emit('restartGame', { roomId, nextPlayer });
        } catch (e) {
            console.log("error: ", e);
        };

    };

    const handleLeaveRoom = () => {
        socket.emit('leaveRoom', { roomId, userAddress: walletAddress, isCreator: walletAddress === creatorAddress ? true : false })
        setRoomId(null);
        setGameStatus('LOBBY');
        setOpponentAddress(null);
        setCreatorAddress(null);
        setGameAddress(null);
        setGameContract(null);
        setBoard(BOARD);
        setGameWinner(null);
        addChatMessage({
            sender: 'SYSTEM',
            message: 'You left the room.',
            timestamp: Date.now()
        })
    };

    useEffect(() => {
        signerRef.current = signer;
        creatorRef.current = creatorAddress;
        opponentRef.current = opponentAddress;
        turnRef.current = turn;
        roomIdRef.current = roomId;
        boardRef.current = board;
    }, [ signer, creatorAddress, opponentAddress, turn, roomId, board ]);

    useEffect(() => {
        if (!socket) (setIsLoaded(false));
        setIsLoaded(true);
    }, [ socket ]);

    useEffect(() => {
        if (!walletConnected && isLoaded) {
            setGameStatus('LOBBY');
            setRoomId(null);
            setCreatorAddress(null);
            setOpponentAddress(null);
            setGameAddress(null);
            addChatMessage({ sender: 'SYSTEM', message: 'No wallet connected.', timestamp: Date.now() });

            return;

        };

    }, [ walletConnected, addChatMessage, isLoaded ]);

    useEffect(() => {
        if (walletConnected && isLoaded) addChatMessage({ sender: 'SYSTEM', message: `Wallet ${walletAddress.slice(0, 8)} connected`, timestamp: Date.now() });
    }, [ walletConnected ]);

    useEffect(() => {
        scrollToBottom();
    }, [ chatHistory ]);

    useEffect(() => {
        const newSocket = io.connect(SOCKET_SERVER_URL)
        if (newSocket) setSocket(newSocket);

        newSocket.on('announcement', data => {
            addChatMessage(data);
            return;
        });

        newSocket.on('roomCreated', data => {
            const { roomId, creator } = data;
            setRoomId(roomId);
            setCreatorAddress(creator);
            setGameStatus('WAITING');
            return;
        });

        newSocket.on('creatingGame', data => {
            setGameStatus('PENDING');
            return;
        });

        newSocket.on('opponentJoinedRoom', data => {
            const { joiner, roomId, creator } = data;
            setOpponentAddress(joiner);

            if (!creatorRef.current) setCreatorAddress(creator);
            if (!roomIdRef.current) setRoomId(roomId);
            setGameStatus('READY');
            return;
        });

        newSocket.on('joinError', data => {
            const { message } = data;
            alert(message);
            return;
        })

        newSocket.on('deployFail', data => {
            setGameStatus('READY');
            return;
        });

        newSocket.on('deploySuccess', data => {
            const { newGameAddress } = data;

            const newGameInstance = new ethers.Contract(newGameAddress, TICTACTOE_ABI, signerRef.current);
            const message = {
                sender: 'SYSTEM',
                message: `Contract deployment success, game has started ...`,
                timestamp: Date.now()
            };

            setTurn(creatorRef.current);
            setGameStatus('ACTIVE');
            setGameAddress(newGameAddress);
            setGameContract(newGameInstance);
            addChatMessage(message);
            return;
        });

        newSocket.on('moveSuccess', data => {
            const { nextPlayer, newBoard, winner } = data;
            const updatedBoard = boardRef.current.map(row => [ ...row ]);
            for (const r in updatedBoard) {
                for (const c in updatedBoard[ r ]) {
                    updatedBoard[ r ][ c ] = newBoard[ r ][ c ];
                }
            };

            setBoard(updatedBoard);

            if (winner == null) {
                setTurn(nextPlayer);
                setGameStatus('ACTIVE');
                return;
            };

            setGameWinner(winner);
            setGameStatus('ENDED');
        });

        newSocket.on('restartGame', data => {
            const { nextPlayer } = data;
            const newBoard = boardRef.current.map(() => Array(3).fill(0));
            setBoard(newBoard);
            setTurn(nextPlayer);
            setGameWinner(null);
            setGameStatus('ACTIVE');
        });

        newSocket.on('joinerLeft', data => {
            setOpponentAddress(null);
            setGameAddress(null);
            setGameContract(null);
            setGameStatus('WAITING');
            setBoard(BOARD);
            setGameWinner(null);
        });

        newSocket.on('creatorLeft', data => {
            setCreatorAddress(opponentRef.current);
            setOpponentAddress(null);
            setGameAddress(null);
            setGameContract(null);
            setGameStatus('WAITING');
            setBoard(BOARD);
            setGameWinner(null);
        });

        newSocket.on('transacting', data => {
            setGameStatus('TRANSACTING');
        });

        return () => {
            newSocket.close()
            setSocket(null);
        }

        // usecallback for setChatHistory gives us a custom setter for better readibility, add the variables defined outside useffect into the dependency array
    }, [ addChatMessage ]);

    return (
        <>
            <div className='lobby-page-wrapper'>
                <div className='game-section'>
                    {(gameContract && turn) ? (
                        <Game
                            handleMakeMove={handleMakeMove}
                            gameStatus={gameStatus}
                            turn={turn}
                            creatorAddress={creatorAddress}
                            board={board}
                            opponentAddress={opponentAddress}
                            gameWinner={gameWinner}
                            handleRestartGame={handleRestartGame}
                            gameAddress={gameAddress}
                        />
                    ) : (
                        <div className="placeholder-board">
                            <h2>Waiting to Join or Create a Room...</h2>
                        </div>
                    )}
                </div>
                <div className='chat-section'>
                    {isLoaded && (
                        <div className='chat-container'>
                            <div className='chat-header'>
                                <div>Game Chat</div>
                                {roomId && (
                                    <div>Room ID: {roomId}</div>
                                )}
                            </div>
                            <div className='chat-window'>
                                {chatHistory.map(({ sender, message, timestamp }, index) => (
                                    <div className={`message-wrapper`} key={sender + timestamp + index}>
                                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '18px', color: '#799b9bff' }}>
                                            <div>{sender === 'SYSTEM' ? 'System' : sender === walletAddress ? 'You' : 'Opponent'}</div>
                                            <div>{new Date(timestamp).toLocaleTimeString()}</div>
                                        </div>
                                        <p className={`message message-${sender === 'SYSTEM' ? 'system' : sender === walletAddress ? 'self' : 'opponent'}`}>{message}</p>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className='input-field'>
                                {gameStatus !== 'LOBBY' && (
                                    <div id="chat-message-form" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', width: '100%', height: '100%' }}>
                                        <input
                                            id="chat-message-input"
                                            type="text"
                                            value={chatMessage}
                                            placeholder='Type a message here...'
                                            onChange={e => setChatMessage(e.target.value)}
                                            style={{ style: 'unset', height: '20px', padding: '7px', width: '55%', borderRadius: '5px' }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    if (chatMessage.length > 255) return alert("Message cannot exceed 255 characters.");
                                                    socket.emit("chatMessage", { roomId, sender: walletAddress, message: chatMessage });
                                                    setChatMessage("");
                                                };
                                            }}
                                        ></input>
                                        <button
                                            className='btn'
                                            onClick={e => handleSend(e)}
                                        >Send</button>
                                    </div>
                                )}
                            </div>
                            {walletConnected && (
                                <div style={{ marginBottom: "10px" }}>
                                    {gameStatus === 'LOBBY' ? (
                                        <>
                                            <button className='btn' style={{ width: "90%", padding: '5px' }} onClick={e => handleCreateRoom(e)}>Create Room</button>
                                            <div style={{ flexDirection: 'column', alignItems: 'center' }}> ------ OR ------</div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <input
                                                    style={{ style: 'unset', padding: '7px', marginRight: '10px' }}
                                                    type='text'
                                                    value={joinRoom}
                                                    placeholder='Room Number'
                                                    onChange={e => { setJoinRoom(e.target.value) }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            if (joinRoom.length !== 6) {
                                                                alert("Room ID must be 6 characters long");
                                                                return;
                                                            }
                                                            socket.emit("joinRoom", { userAddress: walletAddress, roomId: joinRoom })
                                                            setRoomId(joinRoom);
                                                        };
                                                    }}
                                                ></input>
                                                <button
                                                    className='btn'
                                                    onClick={e => handleJoinRoom(e)}
                                                >Join Room</button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <button className='btn' style={{ marginRight: '10px' }} disabled={gameStatus === 'PENDING' || gameStatus === 'TRANSACTING'} onClick={e => handleLeaveRoom(e)}>Leave Room</button>
                                        </>
                                    )}
                                    {gameStatus === 'READY' && (
                                        <>
                                            <button className='btn' disabled={creatorAddress !== walletAddress} onClick={e => handleStartGame(e)}>Start Game</button>
                                        </>
                                    )}
                                    {gameStatus === 'PENDING' && (
                                        <>
                                            <button className='btn' disabled={true}>Game is starting ...</button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div >

        </>
    );
}
