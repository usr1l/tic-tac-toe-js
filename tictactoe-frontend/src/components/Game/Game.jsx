import { useState } from "react";
import Square from "./Square";
import { useWalletProvider } from "../../context/useWalletProvider";
import "./Game.css";

const BOARD = Array(3).fill(null).map(() => Array(3).fill(null));
const PLAYER_X = "X";
const PLAYER_O = "O";


function Board({ handleMakeMove, gameStatus, turn }) {
    const { walletAddress } = useWalletProvider();

    const [ board, setBoard ] = useState(BOARD);
    const [ row, setRow ] = useState(null);
    const [ col, setCol ] = useState(null);
    const [ symbol, setSymbol ] = useState(PLAYER_X);
    const [ move, setMove ] = useState('');
    const [ errMessage, setErrMessage ] = useState("");

    const handleTileClick = (e, r, c) => {
        e.preventDefault();
        if (gameStatus !== 'ACTIVE' || walletAddress !== turn) {
            console.log('GAME STATUS: ', gameStatus)
            console.log('TURN: ', turn)
            setErrMessage("It is not your turn");
            return;
        };

        if (board[ r ][ c ] !== null) {
            setErrMessage("Space is already taken.");
            return;
        };

        setErrMessage('');
        setRow(r);
        setCol(c);
        setMove(`Seleceted space (${r}, ${c})`)
        return;
    };


    const handleMoveSubmit = async (e) => {
        e.preventDefault();
        const success = await handleMakeMove(row, col);

        if (success) {
            const newBoard = board.map(r => [ ...r ]);
            newBoard[ row ][ col ] = symbol;
            setBoard(newBoard);
            symbol === PLAYER_X ? setSymbol(PLAYER_O) : setSymbol(PLAYER_X);
        };

        setMove('');
        setErrMessage('');
        setRow(null);
        setCol(null);
        return;
    };

    return (
        <div className="game-board">
            <h2>{`Current Player: ${symbol === PLAYER_X ? "X" : "O"}`}</h2>
            <label style={{ height: "40px", color: "red" }}>{errMessage || move}</label>
            {board.map((row, i) => (
                <div className="game-board-row" key={`row-${i}`}>
                    {row.map((space, j) => (
                        <Square
                            key={`space[${i}][${j}]`}
                            value={board[ i ][ j ]}
                            handleTileClick={(e) => handleTileClick(e, i, j)}
                        />
                    ))}
                </div>
            ))}
            <button disabled={gameStatus !== 'ACTIVE' || walletAddress !== turn} onClick={e => handleMoveSubmit(e)}>Submit Move</button>
        </div>
    )
}

export default function Game({ handleMakeMove, turn, gameStatus }) {
    const { walletAddress, walletConnected } = useWalletProvider();
    return (
        <div className="lobby-container">
            <div className="game">
                <h1>TIC TAC TOE</h1>
                <div>
                    <div>Player 1: {walletAddress.slice(0, 8)}...</div>
                </div>
                {walletConnected ? (
                    <Board handleMakeMove={handleMakeMove} turn={turn} gameStatus={gameStatus} />
                ) : (
                    <div>Select a wallet from above</div>
                )}
            </div>
        </div>
    );
}
