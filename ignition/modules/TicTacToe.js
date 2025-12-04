import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PLAYER_O_ADDRESS = "0x84d2d6536fe3553c537233160f3611a794b18d13";

export default buildModule("TicTacToeModule", (m) => {
    const ticTacToe = m.contract("TicTacToe", [ PLAYER_O_ADDRESS ]);

    return { ticTacToe };
})
