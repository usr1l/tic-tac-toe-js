import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TICTACTOE_ABI } from '../../config';
import { io } from 'socket.io-client';
import { ethers } from 'ethers';
import { useWalletProvider } from '../../context/useWalletProvider';
import Game from './Game';
import "./Chat.css";

const SOCKET_SERVER_URL = "http://localhost:5001";

export default function Lobby() {
    const { walletAddress, factoryContract, walletConnected, signer } = useWalletProvider();

    const [ isLoaded, setIsLoaded ] = useState(false);
    const [ socket, setSocket ] = useState(null);
    const [ creatorAddress, setCreatorAddress ] = useState(null);
    const [ roomId, setRoomId ] = useState(null);
    const [ opponentAddress, setOpponentAddress ] = useState(null);
    const [ gameAddress, setGameAddress ] = useState(null);
    const [ gameContract, setGameContract ] = useState(null);

    // 'LOBBY', 'WAITING', 'READY', 'PENDING', 'ACTIVE'
    const [ gameStatus, setGameStatus ] = useState('LOBBY');
    const [ turn, setTurn ] = useState(null);
    const [ joinRoom, setJoinRoom ] = useState('');
    const [ chatMessage, setChatMessage ] = useState('');
    const [ chatHistory, setChatHistory ] = useState([]);

    // using this useref to help with keeping refs to states, or else the websockets useffect
    // will only get references stale variables, as it doesn't update
    // adding variables to the reference array causes the useeffect to rerender multiple times,
    // not the desired effects i wanted.
    const signerRef = useRef(signer);
    const creatorRef = useRef(creatorAddress);
    const roomIdRef = useRef(roomId);
    const opponentRef = useRef(opponentAddress);
    const turnRef = useState(turn);

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
        socket.emit("chatMessage", { roomId, sender: walletAddress, message: chatMessage });
        setChatMessage("");
    };

    const handleCreateRoom = (e) => {
        e.preventDefault();
        addChatMessage({ sender: 'SYSTEM', message: '[SYSTEM]: Creating a room...', timestamp: Date.now() });
        socket.emit("createRoom", { userAddress: walletAddress })
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();
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
        setGameStatus('PENDING');
        socket.emit('submitMove', { roomId, r, c, walletAddress });
        try {
            // this waits for the preinstantiated contract
            const tx = await gameContract.makeMove(r, c);
            // this waits for the transaction to be mined
            await tx.wait();

            socket.emit('moveSuccess', { roomId, r, c, walletAddress });
            setTurn(turn === creatorAddress ? opponentAddress : creatorAddress);
            setGameStatus('ACTIVE');
            return true;
        } catch (e) {
            console.log("error: ", e);
            socket.emit('moveFail', { roomId });
            setGameStatus('ACTIVE');
            return false;
        };

    };

    useEffect(() => {
        signerRef.current = signer;
        creatorRef.current = creatorAddress;
        opponentRef.current = opponentAddress;
        turnRef.current = turn;
        roomId.current = roomId
    }, [ signer, creatorAddress, opponentAddress, turn, roomId ]);

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
            addChatMessage({ sender: 'SYSTEM', message: '[SYSTEM]: No wallet connected.', timestamp: Date.now() });

            return;

        };

    }, [ walletConnected, addChatMessage, isLoaded ]);

    useEffect(() => {
        if (walletConnected && isLoaded) addChatMessage({ sender: 'SYSTEM', message: `[SYSTEM]: Wallet ${walletAddress.slice(0, 8)} connected`, timestamp: Date.now() });
    }, [ walletConnected ]);

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
            return;
        });

        newSocket.on('creatingGame', data => {
            setGameStatus('PENDING');
            return;
        });

        newSocket.on('opponentJoinedRoom', data => {
            const { joiner, roomId, creator } = data;
            setOpponentAddress(joiner);

            if (!creatorAddress.current) setCreatorAddress(creator);
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

            const { newGameAddress, creator } = data;

            const newGameInstance = new ethers.Contract(newGameAddress, TICTACTOE_ABI, signerRef.current);
            const message = {
                sender: 'SYSTEM',
                message: `[SYSTEM]: Contract deployment success, game has started ...`,
                timestamp: Date.now()
            };

            setTurn(creatorRef.current);
            setGameStatus('ACTIVE');
            setGameAddress(newGameAddress);
            setGameContract(newGameInstance);
            addChatMessage(message);
            return;
        });

        newSocket.on('moveSuccess', ({ roomId, r, c }) => {

        });

        return () => {
            newSocket.close()
            setSocket(null);
        }

        // usecallback for setChatHistory gives us a custom setter for better readibility, add the variables defined outside useffect into the dependency array
    }, [ addChatMessage ]);

    return (
        <>
            {(gameContract && turn) && (<Game handleMakeMove={handleMakeMove} gameStatus={gameStatus} turn={turn} />)}
            {isLoaded && (
                <div className='chat-container'>
                    <div className='chat-header'>Game Chat</div>
                    <div className='chat-window'>
                        {chatHistory.map(({ sender, message, timestamp }) => (
                            <div key={sender + timestamp}>{message}</div>
                        ))}
                    </div>
                    <div className='input-field'>
                        <form id="chat-message-form">
                            <input
                                id="chat-message-input"
                                type="text"
                                value={chatMessage}
                                placeholder='Type a message here...'
                                onChange={e => setChatMessage(e.target.value)}
                            ></input>
                            <button onClick={handleSend}>Send</button>
                        </form>
                    </div>
                    {walletConnected && (
                        <div>
                            {gameStatus == 'LOBBY' && (
                                <>
                                    <button onClick={handleCreateRoom}>Create Room</button>
                                    <input
                                        type='text'
                                        value={joinRoom}
                                        placeholder='Room Number'
                                        onChange={e => setJoinRoom(e.target.value)}
                                    ></input>
                                    <button onClick={handleJoinRoom}>Join Room</button>
                                    {/* <button className="restart" onClick={restart} >Restart</button> */}
                                </>
                            )}
                            {gameStatus === 'READY' && (
                                <>
                                    <button disabled={creatorAddress !== walletAddress} onClick={handleStartGame}>Start Game</button>
                                </>
                            )}
                            {gameStatus === 'PENDING' && (
                                <>
                                    <button disabled={true}>Game is starting ...</button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

        </>
    );
}
