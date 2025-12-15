import { useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import "./Chat.css";

const SOCKET_SERVER_URL = "http://localhost:5173";

export default function Lobby({ walletAddress, factoryContract, walletConnected }) {
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

    // console.log(chatHistory)

    // prevents the function from being recreated every render
    const addChatMessage = useCallback(messageObj => {
        setChatHistory([ ...chatHistory, messageObj ]);
    }, []);

    const isCreator = useMemo(() => {
        if (!walletAddress || !roomId || !factoryContract) return false;

        return gameStatus !== 'LOBBY' && walletAddress.toLowerCase() === creatorAddress.toLowerCase();
    }, [ walletAddress, creatorAddress ]);


    useEffect(() => {
        if (!socket) return;
        setIsLoaded(true)
    }, [ socket, addChatMessage ]);

    // useEffect(() => {
    //     if (socket && isLoaded && !walletConnected) {
    //         addChatMessage({ sender: 'SYSTEM', message: "No wallet connected", timestamp: Date.now() });
    //     }
    // }, [ addChatMessage, socket, isLoaded, walletConnected ])


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
        if (walletConnected) addChatMessage({ sender: 'SYSTEM', message: `Wallet ${walletAddress.slice(0, 8)} connected`, timestamp: Date.now() });

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

        return () => newSocket.close();
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
                            <button>Send</button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
