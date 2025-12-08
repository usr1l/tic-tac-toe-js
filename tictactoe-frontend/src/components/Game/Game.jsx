import React from "react"


const symbol = player => {
    if (player === 1) return 'X';
    if (player === 2) return 'O';
    return '';
}

const Square = ({ player }) => {
    return (
        <div className="square">

        </div>
    )
}
