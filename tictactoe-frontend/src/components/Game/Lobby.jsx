import { useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import "./Chat.css";
import { useWalletProvider } from '../../context/useWalletProvider';


const SOCKET_SERVER_URL = "http://localhost:5001";

export default function Lobby() {
    const { walletAddress, factoryContract, walletConnected } = useWalletProvider();

    const [ isLoaded, setIsLoaded ] = useState(false);
    const [ socket, setSocket ] = useState(null);
    const [ creatorAddress, setCreatorAddress ] = useState(null);
    const [ roomId, setRoomId ] = useState(null);
    const [ opponentAddress, setOpponentAddress ] = useState(null);

    // 'LOBBY', 'WAITING', 'READY', 'PENDING', 'ACTIVE'
    const [ gameStatus, setGameStatus ] = useState('LOBBY');
    const [ joinRoom, setJoinRoom ] = useState('');
    const [ chatMessage, setChatMessage ] = useState('');
    const [ chatHistory, setChatHistory ] = useState([]);


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
            console.log(receipt)
        } catch (e) {
            console.log("error: ", e)
        };
    };

    const handleTest = async () => {
        e.preventDefault();
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

            const newGameAddress = gameCreatedEvent.args[ 0 ];


            console.log(newGameAddress)
        } catch (e) {
            console.log("error: ", e)
        };
    }

    useEffect(() => {
        if (!socket) return;
        setIsLoaded(true);
    }, [ socket ]);

    useEffect(() => {
        if (!walletConnected && isLoaded) {
            setGameStatus('LOBBY');
            setRoomId(null);
            setCreatorAddress(null);
            setOpponentAddress(null);
            addChatMessage({ sender: 'SYSTEM', message: '[SYSTEM]: No wallet connected.', timestamp: Date.now() });

            return;

        };

    }, [ walletConnected, addChatMessage, isLoaded ]);

    useEffect(() => {
        if (walletConnected && isLoaded) addChatMessage({ sender: 'SYSTEM', message: `[SYSTEM]: Wallet ${walletAddress.slice(0, 8)} connected`, timestamp: Date.now() });
    }, [ walletConnected ]);

    useEffect(() => {
        const newSocket = io.connect(SOCKET_SERVER_URL);
        setSocket(newSocket);

        newSocket.on('newMessage', data => {
            addChatMessage(data);
        });

        newSocket.on('announcement', data => {
            addChatMessage(data);
        });

        newSocket.on('roomCreated', data => {
            const { roomId, creator } = data;
            setRoomId(roomId);
            setCreatorAddress(creator);
        });

        newSocket.on('creatingGame', data => {
            setGameStatus('PENDING');
            addChatMessage(data);
        });

        newSocket.on('opponentJoinedRoom', data => {
            const { joiner, roomId, creator } = data;
            setOpponentAddress(joiner);

            if (!creator) setCreatorAddress(creator);
            if (!roomId) setRoomId(roomId);
            setGameStatus('READY');
        });

        newSocket.on('joinError', data => {
            const { message } = data;
            alert(message);
        })

        return () => {
            setSocket(null);
            newSocket.close()
        };
        // usecallback for setChatHistory gives us a custom setter for better readibility, add the variables defined outside useffect into the dependency array
    }, [ addChatMessage ]);

    return (
        <>
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
                                    <button disabled={creatorAddress !== walletAddress} onClick={handleTest}>Game is starting ...</button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
