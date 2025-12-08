import "./Game.css";


export default function Square({ space, value, handleTileClick }) {
    return (
        <div key={space} className="square" onClick={handleTileClick} >
            {value}
        </div>
    );
}
