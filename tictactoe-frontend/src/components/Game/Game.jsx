import { useState } from "react";
import "./Game.css";

const BOARD = Array(3).fill(null).map(() => Array(3).fill(0));

const symbol = player => {
    if (player === 1) return 'X';
    if (player === 2) return 'O';
    return '';
}

// const [ turn, setTurn ] = useState("X");

function Square({ key, player }) {
    return (
        <div key={key} className="square">
            {/* {symbol(player)} */}
            <div>{"X"}</div>
        </div>
    );
}

function Board({}) {
    const [ board, setBoard ] = useState(BOARD);
    return (
        <div className="game-board">
            {board.map((row, i) => (
                <div key={`row-${i}`}>
                    {row.map((space, j) => (
                        <Square key={`space[${i}][${j}]`} />
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
