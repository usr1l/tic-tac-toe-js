import { useState } from "react";
import Square from "./Square";
// import useEIP6963Providers from "../../hooks/"
import "./Game.css";

const BOARD = Array(3).fill(null).map(() => Array(3).fill(null));
const PLAYER_X = "X";
const PLAYER_O = "O";


function Board({}) {
    const [ board, setBoard ] = useState(BOARD);
    const [ turn, setTurn ] = useState(PLAYER_X);
    const [ errMessage, setErrMessage ] = useState("");

    const handleTileClick = (r, c) => {
        const newBoard = board.map(row => [ ...row ]);
        if (newBoard[ r ][ c ] !== null) {
            setErrMessage("Space is already taken.");
            return;
        }

        newBoard[ r ][ c ] = turn;
        setBoard(newBoard);
        setErrMessage("");
        turn === PLAYER_X ? setTurn(PLAYER_O) : setTurn(PLAYER_X);
        return;
    }

    const restart = () => {
        setBoard(BOARD);
        setTurn(PLAYER_X);
        setErrMessage("");
    }

    return (
        <div className="game-board">
            <h2>{`Current Player: ${turn === PLAYER_X ? "X" : "O"}`}</h2>
            <label style={{ height: "40px", color: "red" }}>{errMessage}</label>
            {board.map((row, i) => (
                <div className="game-board-row" key={`row-${i}`}>
                    {row.map((space, j) => (
                        <Square
                            space={`space[${i}][${j}]`}
                            value={board[ i ][ j ]}
                            handleTileClick={() => handleTileClick(i, j)}
                        />
                    ))}
                </div>
            ))}
            <button className="restart" onClick={restart} >Restart</button>
        </div>
    );
}

export default function Game() {

    return (
        <div className="game">
            <h1>TIC TAC TOE</h1>
            <Board />
        </div>
    );
}
