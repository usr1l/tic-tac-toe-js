export const TICTACTOEFACTORY_ADDRESS = "0xc7ce062180f84800ed1b9ce388b633401b66ee6a";

export const TICTACTOE_ABI = [
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": true,
					"internalType": "address",
					"name": "winner",
					"type": "address"
				}
			],
			"name": "GameEnded",
			"type": "event"
		},
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": true,
					"internalType": "address",
					"name": "gameAddress",
					"type": "address"
				},
				{
					"indexed": true,
					"internalType": "address",
					"name": "pX",
					"type": "address"
				},
				{
					"indexed": true,
					"internalType": "address",
					"name": "pO",
					"type": "address"
				}
			],
			"name": "GameStarted",
			"type": "event"
		},
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": true,
					"internalType": "address",
					"name": "player",
					"type": "address"
				},
				{
					"indexed": false,
					"internalType": "uint8",
					"name": "r",
					"type": "uint8"
				},
				{
					"indexed": false,
					"internalType": "uint8",
					"name": "c",
					"type": "uint8"
				},
				{
					"indexed": false,
					"internalType": "uint8",
					"name": "marker",
					"type": "uint8"
				}
			],
			"name": "MoveMade",
			"type": "event"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"name": "board",
			"outputs": [
				{
					"internalType": "uint8",
					"name": "",
					"type": "uint8"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "getBoardState",
			"outputs": [
				{
					"internalType": "uint8[3][3]",
					"name": "",
					"type": "uint8[3][3]"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "getPlayerO",
			"outputs": [
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "getPlayerX",
			"outputs": [
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "getPlayers",
			"outputs": [
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				},
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address payable",
					"name": "_playerX",
					"type": "address"
				},
				{
					"internalType": "address payable",
					"name": "_playerO",
					"type": "address"
				}
			],
			"name": "initialize",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "isGameOver",
			"outputs": [
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint8",
					"name": "row",
					"type": "uint8"
				},
				{
					"internalType": "uint8",
					"name": "col",
					"type": "uint8"
				}
			],
			"name": "makeMove",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "nextPlayer",
			"outputs": [
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "restartGame",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "winner",
			"outputs": [
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				}
			],
			"stateMutability": "view",
			"type": "function"
		}
	]

export const TICTACTOEFACTORY_ABI = [
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": false,
					"internalType": "address",
					"name": "gameAddress",
					"type": "address"
				},
				{
					"indexed": false,
					"internalType": "address",
					"name": "playerX",
					"type": "address"
				},
				{
					"indexed": false,
					"internalType": "address",
					"name": "playerO",
					"type": "address"
				}
			],
			"name": "GameCreated",
			"type": "event"
		},
		{
			"inputs": [
				{
					"internalType": "address payable",
					"name": "_playerO",
					"type": "address"
				}
			],
			"name": "createNewGame",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"name": "deployedGames",
			"outputs": [
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				}
			],
			"stateMutability": "view",
			"type": "function"
		}
	]

export const SEPOLIA_CHAIN_ID = 11155111;
