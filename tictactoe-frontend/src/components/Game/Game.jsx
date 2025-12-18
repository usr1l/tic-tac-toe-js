import { useState } from "react";
import Square from "./Square";
import { useWalletProvider } from "../../context/useWalletProvider";
import "./Game.css";

const PLAYER_X = "X";
const PLAYER_O = "O";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function Board({
    handleMakeMove,
    gameStatus,
    turn,
    creatorAddress,
    board,
    gameWinner,
    handleRestartGame
}) {

    const { walletAddress } = useWalletProvider();

    const [ row, setRow ] = useState(null);
    const [ col, setCol ] = useState(null);
    const [ move, setMove ] = useState('');
    const [ errMessage, setErrMessage ] = useState("");

    const handleTileClick = (e, r, c) => {
        e.preventDefault();
        if (gameStatus === 'ENDED') {
            setErrMessage("Game has ended.")
        };

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
            {!gameWinner ? (
                <button
                    disabled={gameStatus !== 'ACTIVE' || walletAddress !== turn}
                    onClick={e => handleMoveSubmit(e)}
                >Submit Move</button>
            ) : (
                <button
                    disabled={gameWinner === ZERO_ADDRESS ? walletAddress === creatorAddress : gameWinner === walletAddress}
                    onClick={e => handleRestartGame(e)}
                >Restart Game</button>
            )}
        </div>
    )
}

export default function Game({
    handleMakeMove,
    turn,
    gameStatus,
    creatorAddress,
    board,
    gameWinner,
    opponentAddress,
    handleRestartGame
}) {
    const { walletAddress, walletConnected } = useWalletProvider();
    return (
        <div className="lobby-container">
            <div className="game">
                <h1>TIC TAC TOE</h1>
                <div>
                    <div>Player X: {walletAddress.slice(0, 8)}...</div>
                    <div>Player O: {opponentAddress?.slice(0, 8)}...</div>
                    {gameWinner && (
                        <div>
                            {winner !== ZERO_ADDRESS ? `Congratulations, the winner is ${winner.slice(0, 8)}!` : "Game over. It's a tie!"}
                        </div>
                    )}
                </div>
                {walletConnected ? (
                    <Board
                        handleMakeMove={handleMakeMove}
                        turn={turn}
                        gameStatus={gameStatus}
                        creatorAddress={creatorAddress}
                        board={board}
                        gameWinner={gameWinner}
                        handleRestartGame={handleRestartGame}
                    />
                ) : (
                    <div>Select a wallet from above</div>
                )}
            </div>
        </div>
    );
}
