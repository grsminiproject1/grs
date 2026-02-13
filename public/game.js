const socket = io();
const game = new Chess();
const room = location.pathname.split("/")[2];

let myName = "";
let players = { w: "Waiting...", b: "Waiting..." };
let selectedSquare = null;
let validMoves = [];

const symbols = {
    p:"♟", r:"♜", n:"♞", b:"♝", q:"♛", k:"♚",
    P:"♙", R:"♖", N:"♘", B:"♗", Q:"♕", K:"♔"
};

// Handle Name Entry
window.onload = () => {
    myName = prompt("Enter your name:") || "Player";
    socket.emit("joinRoom", { room, name: myName });
};

socket.on("playerUpdate", (data) => {
    players = data;
    updateUI();
});

function drawBoard() {
    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";
    
    // Use the engine's board state to fix missing pieces
    const boardState = game.board(); 

    boardState.forEach((row, r) => {
        row.forEach((piece, c) => {
            const sq = document.createElement("div");
            const squareName = String.fromCharCode(97 + c) + (8 - r);
            sq.className = `square ${(r + c) % 2 === 0 ? "light" : "dark"}`;
            
            if (validMoves.includes(squareName)) sq.classList.add("highlight");

            if (piece) {
                sq.textContent = symbols[piece.color === "w" ? piece.type.toUpperCase() : piece.type];
            }

            sq.onclick = () => onSquareClick(squareName);
            boardDiv.appendChild(sq);
        });
    });
    updateUI();
}

function onSquareClick(square) {
    if (!selectedSquare) {
        const piece = game.get(square);
        if (!piece || piece.color !== game.turn()) return;
        selectedSquare = square;
        validMoves = game.moves({ square, verbose: true }).map(m => m.to);
    } else {
        const move = game.move({ from: selectedSquare, to: square, promotion: "q" });
        if (move) {
            socket.emit("move", { fen: game.fen(), lastMove: move });
            addCapturedPiece(move);
        }
        selectedSquare = null;
        validMoves = [];
    }
    drawBoard();
}

function addCapturedPiece(move) {
    if (!move.captured) return;
    // If white moves, black piece is captured
    const side = move.color === 'w' ? 'capWhite' : 'capBlack';
    const symbol = symbols[move.color === 'w' ? move.captured : move.captured.toUpperCase()];
    document.getElementById(side).innerHTML += `<span>${symbol}</span>`;
}

function updateUI() {
    const turn = game.turn();
    document.getElementById("name-w").innerText = players.w;
    document.getElementById("name-b").innerText = players.b;
    document.getElementById("status").innerText = `${turn === 'w' ? players.w : players.b}'s Turn`;
    
    // Highlight side panel of whose turn it is
    document.getElementById("side-w").classList.toggle("active-turn", turn === 'w');
    document.getElementById("side-b").classList.toggle("active-turn", turn === 'b');
}

socket.on("move", (data) => {
    game.load(data.fen);
    if(data.lastMove) addCapturedPiece(data.lastMove);
    drawBoard();
});

drawBoard();
