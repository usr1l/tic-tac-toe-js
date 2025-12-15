import { useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import "./Chat.css";
import { useWalletProvider } from '../../context/useWalletProvider';

const SOCKET_SERVER_URL = "http://localhost:5173";

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
        console.log(chatHistory)
        setChatHistory(prev => [ ...prev, messageObj ]);
    }, []);

    const isCreator = useMemo(() => {
        if (!walletAddress || !roomId || !factoryContract) return false;

        return gameStatus !== 'LOBBY' && walletAddress.toLowerCase() === creatorAddress.toLowerCase();
    }, [ walletAddress, creatorAddress ]);

    const handleSend = (e) => {
        e.preventDefault();
        addChatMessage({ sender: walletAddress, message: chatMessage, timestamp: Date.now() });
        setChatMessage("");
    };

    useEffect(() => {
        if (!socket) return;
        setIsLoaded(true)
    }, [ socket ]);

    useEffect(() => {
        if (!walletConnected && isLoaded) {
            setGameStatus('LOBBY');
            setRoomId(null);
            setCreatorAddress(null);
            setOpponentAddress(null);
            addChatMessage({ sender: 'SYSTEM', message: 'No wallet connected.', timestamp: Date.now() });

            return;

        };

    }, [ walletConnected, addChatMessage, isLoaded ]);

    useEffect(() => {
        if (walletConnected && isLoaded) addChatMessage({ sender: 'SYSTEM', message: `Wallet ${walletAddress.slice(0, 8)} connected`, timestamp: Date.now() });
    }, [ walletConnected ]);

    useEffect(() => {
        const newSocket = io(SOCKET_SERVER_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log("Connected to Server:", newSocket.id);
        });

        newSocket.on('announcement', data => {
            addChatMessage(data);
        });

        newSocket.on('roomCreated', data => {
            const { roomId, creator } = data;
            setRoomId(roomId);
            setCreatorAddress(creator);
            setGameStatus('WAITING');
        });

        newSocket.on('opponentJoinedRoom', data => {
            const { joiner } = data;
            setOpponentAddress(joiner);
            setGameStatus('READY');
        });

        newSocket.on('newMessage', data => {
            addChatMessage(data);
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
                            <div key={timestamp + message}>{message}</div>
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
                            <button>Create Room</button>
                            <button>Join Room</button>
                            {/* <button className="restart" onClick={restart} >Restart</button> */}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
