import { useEffect, useState } from "react";
import Square from "./Square";
import Lobby from "./Lobby";
import { useWalletProvider } from "../../context/useWalletProvider";
import "./Game.css";

const BOARD = Array(3).fill(null).map(() => Array(3).fill(null));
const PLAYER_X = "X";
const PLAYER_O = "O";


function Board({ handleMakeMove }) {
    const [ board, setBoard ] = useState(BOARD);
    const [ turn, setTurn ] = useState(PLAYER_X);
    const [ errMessage, setErrMessage ] = useState("");

    const handleTileClick = async (e, r, c) => {
        e.preventDefault();
        const newBoard = board.map(row => [ ...row ]);
        if (newBoard[ r ][ c ] !== null) {
            setErrMessage("Space is already taken.");
            return;
        }

        try {
            await handleMakeMove(r, c);

        } catch (e) {
            console.log('error: ', e);
        };

        newBoard[ r ][ c ] = turn;
        setBoard(newBoard);
        setErrMessage("");
        turn === PLAYER_X ? setTurn(PLAYER_O) : setTurn(PLAYER_X);
        return;
    }

    return (
        <div className="game-board">
            <h2>{`Current Player: ${turn === PLAYER_X ? "X" : "O"}`}</h2>
            <label style={{ height: "40px", color: "red" }}>{errMessage}</label>
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
        </div>
    )
}

export default function Game({ handleMakeMove }) {
    const { walletAddress, signer, factoryContract, walletConnected } = useWalletProvider();
    return (
        <div className="lobby-container">
            <div className="game">
                <h1>TIC TAC TOE</h1>
                <div>
                    <div>Player 1: {walletAddress.slice(0, 8)}...</div>
                </div>
                {walletConnected ? (
                    <Board handleMakeMove={handleMakeMove} />
                ) : (
                    <div>Select a wallet from above</div>
                )}
            </div>
        </div>
    );
}
