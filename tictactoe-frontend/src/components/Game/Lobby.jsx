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

        return gameStatus !== 'LOBBY' && walletAddress === factoryContract.signer.getAddress();
    });
}
