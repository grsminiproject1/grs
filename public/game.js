const socket = io();
const room = location.pathname.split("/")[2];
const name = sessionStorage.getItem("playerName") || "Player";

socket.emit("joinRoom", { room, name });

const game = new Chess();

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const whiteCap = document.getElementById("whiteCaptured");
const blackCap = document.getElementById("blackCaptured");
const messages = document.getElementById("messages");

let selected = null;
let moves = [];

const PIECES = {
  p:"♟", r:"♜", n:"♞", b:"♝", q:"♛", k:"♚",
  P:"♙", R:"♖", N:"♘", B:"♗", Q:"♕", K:"♔"
};

function draw() {
  boardEl.innerHTML = "";
  const board = game.board();

  board.forEach((row, r) => {
    row.forEach((piece, c) => {
      const sq = document.createElement("div");
      const square = "abcdefgh"[c] + (8 - r);
      sq.className = "square " + ((r + c) % 2 ? "dark" : "light");
      if (moves.includes(square)) sq.classList.add("highlight");

      if (piece) {
        const key = piece.color === "w" ? piece.type.toUpperCase() : piece.type;
        sq.textContent = PIECES[key];
      }

      sq.onclick = () => click(square);
      boardEl.appendChild(sq);
    });
  });

  updateStatus();
}

function click(square) {
  if (!selected) {
    const p = game.get(square);
    if (!p || p.color !== game.turn()) return;
    selected = square;
    moves = game.moves({ square, verbose: true }).map(m => m.to);
  } else {
    if (moves.includes(square)) {
      const move = game.move({ from: selected, to: square, promotion: "q" });
      if (move) {
        updateCaptured(move);
        socket.emit("move", game.fen());
      }
    }
    selected = null;
    moves = [];
  }
  draw();
}

function updateCaptured(move) {
  if (!move.captured) return;
  const target = move.color === "w" ? whiteCap : blackCap;
  const sym = move.color === "w"
    ? PIECES[move.captured]
    : PIECES[move.captured.toUpperCase()];
  target.textContent += sym;
}

function updateStatus() {
  statusEl.textContent =
    game.in_checkmate() ? "Checkmate!" :
    game.in_check() ? `${game.turn() === "w" ? "White" : "Black"} in Check` :
    `${name}'s turn (${game.turn() === "w" ? "White" : "Black"})`;
}

socket.on("move", fen => {
  game.load(fen);
  draw();
});

socket.on("chat", msg => {
  const li = document.createElement("li");
  li.textContent = msg;
  messages.appendChild(li);
});

socket.on("system", msg => {
  const li = document.createElement("li");
  li.textContent = msg;
  messages.appendChild(li);
});

function sendMsg() {
  const input = document.getElementById("msg");
  if (input.value.trim()) {
    socket.emit("chat", `${name}: ${input.value}`);
    input.value = "";
  }
}

draw();
