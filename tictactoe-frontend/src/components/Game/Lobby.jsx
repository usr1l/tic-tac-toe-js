import { useState, useEffect, useCallback } from 'react';
import useWallet from '../../hooks/useWallet';

const SOCKET_SERVER_URL = "http://localhost:5000";

export default function Lobby({ provider }) {
    const { walletAddress, factoryContract, signer, walletConnected } = useWallet();

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

    useEffect(() => {
        if (!walletConnected) {
            setGameStatus('LOBBY');
            setRoomId(null);
            setCreatorAddress(null);
            setOpponentAddress(null);

            if (socket) {
                socket.close();
                setSocket(null);
                addChatMessage({ sender: 'SYSTEM', message: "Wallet disconnected, lobby has been cleared", timestamp: Date.now() });
            };

            return;

        };

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
    }, [ walletConnected, addChatMessage ]);

    return <div>Lobby Loaded. Wallet: {walletAddress}</div>
}
