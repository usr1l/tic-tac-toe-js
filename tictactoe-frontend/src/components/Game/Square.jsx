import "./Game.css";


export default function Square({ value, handleTileClick, isSelected }) {

    return (
        <div className={`square ${isSelected ? 'selected' : ''}`} onClick={handleTileClick} >
            {value}
        </div>
    );
}
