import "./Game.css";


export default function Square({ value, handleTileClick }) {
    return (
        <div className="square" onClick={handleTileClick} >
            {value}
        </div>
    );
}
