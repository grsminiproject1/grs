const socket = io();
const game = new Chess();
const room = window.location.pathname.split("/")[2];

// UI Elements
const boardDiv = document.getElementById("board");
const statusDiv = document.getElementById("status");
const roomLinkInput = document.getElementById("roomLink");
const msgInput = document.getElementById("msgInput");
const messagesDiv = document.getElementById("messages");

let selectedSquare = null;
let validMoves = [];
let myName = prompt("Enter your name:") || "Player";

// Share link
roomLinkInput.value = window.location.href;

// Symbols Map
const symbols = {
    p:"♟", r:"♜", n:"♞", b:"♝", q:"♛", k:"♚",
    P:"♙", R:"♖", N:"♘", B:"♗", Q:"♕", K:"♔"
};

socket.emit("joinRoom", { room, name: myName });

// --- GAME LOGIC ---

function drawBoard() {
    boardDiv.innerHTML = "";
    const currentBoard = game.board();

    currentBoard.forEach((row, r) => {
        row.forEach((piece, c) => {
            const sq = document.createElement("div");
            const squareName = String.fromCharCode(97 + c) + (8 - r);
            
            sq.className = `square ${(r + c) % 2 === 0 ? "light" : "dark"}`;
            if (validMoves.includes(squareName)) sq.classList.add("highlight");

            if (piece) {
                sq.textContent = symbols[piece.color === 'w' ? piece.type.toUpperCase() : piece.type];
            }

            sq.onclick = () => onSquareClick(squareName);
            boardDiv.appendChild(sq);
        });
    });
    updateStatus();
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
            handleCaptures(move);
        }
        selectedSquare = null;
        validMoves = [];
    }
    drawBoard();
}

function handleCaptures(move) {
    if (!move.captured) return;
    const targetId = move.color === 'w' ? 'capWhite' : 'capBlack';
    const symbol = symbols[move.color === 'w' ? move.captured : move.captured.toUpperCase()];
    document.getElementById(targetId).innerHTML += `<span>${symbol}</span>`;
}

function updateStatus() {
    const turn = game.turn();
    statusDiv.innerText = `${turn === 'w' ? "White" : "Black"}'s Turn`;
    document.getElementById("side-w").classList.toggle("active", turn === 'w');
    document.getElementById("side-b").classList.toggle("active", turn === 'b');
}

// --- NETWORK LOGIC ---

socket.on("playerUpdate", (players) => {
    document.getElementById("name-w").innerText = players.w || "Waiting...";
    document.getElementById("name-b").innerText = players.b || "Waiting...";
});

socket.on("move", (data) => {
    game.load(data.fen);
    if (data.lastMove) handleCaptures(data.lastMove);
    drawBoard();
});

// --- CHAT LOGIC ---

function sendChat() {
    const text = msgInput.value;
    if (text) {
        socket.emit("chat", text);
        msgInput.value = "";
    }
}

socket.on("chat", (msg) => {
    const p = document.createElement("p");
    p.innerText = msg;
    messagesDiv.appendChild(p);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

drawBoard();
