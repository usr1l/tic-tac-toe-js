import "./Game.css";

// const symbol = value => {
//     if (value === 1) return 'X';
//     if (value === 2) return 'O';
//     return '';
// }


export default function Square({ key, value, handleTileClick }) {
    return (
        <div key={key} className="square" onClick={handleTileClick} >
            {value}
        </div>
    );
}
