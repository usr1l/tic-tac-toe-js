import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PLAYER_O_ADDRESS = "0x6cef8851530e88dba61ea5c6b6fccb0a7a80682d";

export default buildModule("TicTacToeModule", (m) => {
    const ticTacToe = m.contract("TicTacToe", [ PLAYER_O_ADDRESS ]);

    return { ticTacToe };
})
