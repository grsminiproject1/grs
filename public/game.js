const socket = io();
const game = new Chess();
const room = location.pathname.split("/")[2];

let myName = "";
let players = { w: "White", b: "Black" };
let selectedSquare = null;
let validMoves = [];

const symbols = {
    p:"♟", r:"♜", n:"♞", b:"♝", q:"♛", k:"♚",
    P:"♙", R:"♖", N:"♘", B:"♗", Q:"♕", K:"♔"
};

function startGame() {
    myName = document.getElementById("userNameInput").value || "Anonymous";
    document.getElementById("name-modal").style.display = "none";
    socket.emit("joinRoom", { room, name: myName });
    drawBoard();
}

socket.on("playerUpdate", (data) => {
    players = data;
    document.getElementById("name-w").innerText = players.w || "Waiting...";
    document.getElementById("name-b").innerText = players.b || "Waiting...";
});

function drawBoard() {
    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";
    const boardState = game.board();

    boardState.forEach((row, r) => {
        row.forEach((piece, c) => {
            const sq = document.createElement("div");
            const squareName = String.fromCharCode(97 + c) + (8 - r);
            sq.className = `square ${(r + c) % 2 === 0 ? "light" : "dark"}`;
            
            if (validMoves.includes(squareName)) sq.classList.add("highlight");
            if (piece) sq.textContent = symbols[piece.color === "w" ? piece.type.toUpperCase() : piece.type];

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
            updateCaptured(move);
        }
        selectedSquare = null;
        validMoves = [];
    }
    drawBoard();
}

function updateCaptured(move) {
    if (!move.captured) return;
    // If White (w) captured, it goes to White's side (capBlack list)
    const target = move.color === "w" ? "capBlack" : "capWhite";
    const symbol = symbols[move.color === "w" ? move.captured : move.captured.toUpperCase()];
    document.getElementById(target).innerHTML += `<span>${symbol}</span>`;
}

function updateUI() {
    const turn = game.turn();
    const isCheck = game.in_check();
    
    // Highlight active player panel
    document.getElementById("panel-w").classList.toggle("active-turn", turn === "w");
    document.getElementById("panel-b").classList.toggle("active-turn", turn === "b");

    let statusText = `${players[turn]}'s Turn`;
    if (game.in_checkmate()) statusText = "CHECKMATE! " + (turn === 'w' ? players.b : players.w) + " Wins!";
    else if (isCheck) statusText += " (IN CHECK)";
    
    document.getElementById("status").innerText = statusText;
}

socket.on("move", (data) => {
    game.load(data.fen);
    updateCaptured(data.lastMove);
    drawBoard();
});
