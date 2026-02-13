const socket = io();
const room = location.pathname.split("/")[2];
const playerName = sessionStorage.getItem("playerName") || "Player";

socket.emit("joinRoom", { room, name: playerName });

const game = new Chess();
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");

let playerColor = null;
let selectedSquare = null;
let legalMoves = [];

const PIECES = {
  wp: "♙", wr: "♖", wn: "♘", wb: "♗", wq: "♕", wk: "♔",
  bp: "♟", br: "♜", bn: "♞", bb: "♝", bq: "♛", bk: "♚"
};

/* ---------- BOARD RENDER ---------- */
function drawBoard() {
  boardEl.innerHTML = "";

  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const squareName = "abcdefgh"[c] + (8 - r);
      const square = document.createElement("div");

      square.className = `square ${(r + c) % 2 === 0 ? "light" : "dark"}`;
      if (legalMoves.includes(squareName)) square.classList.add("highlight");

      const piece = board[r][c];
      if (piece) {
        square.textContent = PIECES[piece.color + piece.type];
      }

      square.onclick = () => onSquareClick(squareName);
      boardEl.appendChild(square);
    }
  }

  updateStatus();
}

/* ---------- CLICK HANDLING ---------- */
function onSquareClick(square) {
  if (game.game_over()) return;

  const piece = game.get(square);

  if (!selectedSquare) {
    if (!piece) return;
    if (piece.color !== playerColor) return;
    if (piece.color !== game.turn()) return;

    selectedSquare = square;
    legalMoves = game.moves({ square, verbose: true }).map(m => m.to);
  } else {
    if (legalMoves.includes(square)) {
      game.move({ from: selectedSquare, to: square, promotion: "q" });
      socket.emit("move", game.fen());
    }
    selectedSquare = null;
    legalMoves = [];
  }

  drawBoard();
}

/* ---------- STATUS ---------- */
function updateStatus() {
  if (game.in_checkmate()) {
    statusEl.textContent = "Checkmate!";
  } else if (game.in_check()) {
    statusEl.textContent = "Check!";
  } else {
    statusEl.textContent =
      game.turn() === playerColor
        ? `${playerName}'s turn`
        : `Opponent's turn`;
  }
}

/* ---------- SOCKET EVENTS ---------- */
socket.on("assignColor", color => {
  playerColor = color;
  drawBoard();
});

socket.on("move", fen => {
  game.load(fen);
  drawBoard();
});

socket.on("chat", msg => {
  const li = document.createElement("li");
  li.textContent = msg;
  document.getElementById("messages").appendChild(li);
});

/* ---------- CHAT ---------- */
function sendMsg() {
  const input = document.getElementById("msg");
  if (!input.value.trim()) return;
  socket.emit("chat", `${playerName}: ${input.value}`);
  input.value = "";
}

drawBoard();
