import { useState, useEffect } from 'react';
import useWallet from '../../hooks/useWallet';

const SOCKET_SERVER_URL = "http://localhost:5000";

export default function Lobby() {
    const { userAddress, factoryContract } = useWallet();
    const [ socket, setSocket ] = useState(null);

    use
}
