import { useState, useEffect, useCallback } from 'react';
import useWallet from '../../hooks/useWallet';

const SOCKET_SERVER_URL = "http://localhost:5000";

export default function Lobby({ provider }) {
    const { walletAddress, factoryContract, signer, walletConnected } = useWallet();

    const [ socket, setSocket ] = useState(null);
    const [ creatorAddress, setCreatorAddres ] = useState(null);
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
        if (!walletConnected) return;

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
            setCreatorAddres(creator);
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
    });
}
