import { useState } from "react";
import "./Game.css";

const BOARD = Array(3).fill(null).map(() => Array(3).fill(null));

const symbol = value => {
    if (value === 1) return 'X';
    if (value === 2) return 'O';
    return '';
}

// const [ turn, setTurn ] = useState("X");

function Square({ key, value }) {
    return (
        <div key={key} className="square">
            {symbol(value)}
        </div>
    );
}

function Board({}) {
    const [ board, setBoard ] = useState(BOARD);
    return (
        <div className="game-board">
            {board.map((row, i) => (
                <div className="game-board-row" key={`row-${i}`}>
                    {row.map((space, j) => (
                        <Square key={`space[${i}][${j}]`} value={board[ i ][ j ]} />
                    ))}
                </div>
            ))}
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
