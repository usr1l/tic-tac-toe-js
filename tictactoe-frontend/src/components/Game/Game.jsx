import { useEffect, useState } from "react";
import Square from "./Square";
import { useWalletProvider } from "../../context/useWalletProvider";
import "./Game.css";

const PLAYER_X = "X";
const PLAYER_O = "O";

function Board({ handleMakeMove, gameStatus, turn, creatorAddress, opponentAddress, board, setBoard }) {
    const { walletAddress } = useWalletProvider();

    const [ row, setRow ] = useState(null);
    const [ col, setCol ] = useState(null);
    const [ move, setMove ] = useState('');
    const [ errMessage, setErrMessage ] = useState("");

    const handleTileClick = (e, r, c) => {
        e.preventDefault();
        if (gameStatus !== 'ACTIVE' || walletAddress !== turn) {
            setErrMessage("It is not your turn");
            return;
        };

        if (board[ r ][ c ] !== 0) {
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

        setMove('');
        setErrMessage('');
        setRow(null);
        setCol(null);
        return;
    };

    return (
        <div className="game-board">
            <h2>{`Current Player: ${creatorAddress === turn ? PLAYER_X : PLAYER_O}`}</h2>
            <label style={{ height: "40px", color: "red" }}>{errMessage || move}</label>
            {board.map((row, i) => (
                <div className="game-board-row" key={`row-${i}`}>
                    {row.map((space, j) => (
                        <Square
                            key={`space[${i}][${j}]`}
                            value={board[ i ][ j ] == 1 ? PLAYER_X : board[ i ][ j ] == 2 ? PLAYER_O : null}
                            handleTileClick={(e) => handleTileClick(e, i, j)}
                        />
                    ))}
                </div>
            ))}
            <button disabled={gameStatus !== 'ACTIVE' || walletAddress !== turn} onClick={e => handleMoveSubmit(e)}>Submit Move</button>
        </div>
    )
}

export default function Game({ handleMakeMove, turn, gameStatus, creatorAddress, opponentAddress, board, setBoard }) {
    const { walletAddress, walletConnected } = useWalletProvider();
    return (
        <div className="lobby-container">
            <div className="game">
                <h1>TIC TAC TOE</h1>
                <div>
                    <div>Player 1: {walletAddress.slice(0, 8)}...</div>
                </div>
                {walletConnected ? (
                    <Board
                        handleMakeMove={handleMakeMove}
                        turn={turn}
                        gameStatus={gameStatus}
                        creatorAddress={creatorAddress}
                        opponentAddress={opponentAddress}
                        board={board}
                        setBoard={setBoard}
                    />
                ) : (
                    <div>Select a wallet from above</div>
                )}
            </div>
        </div>
    );
}
