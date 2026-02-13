const roomId = location.pathname.split("/")[2];
socket.emit("joinRoom", roomId);

const game = new Chess();

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const capWhite = document.getElementById("capWhite");
const capBlack = document.getElementById("capBlack");

let selectedSquare = null;
let legalMoves = [];

/* Unicode chess pieces */
const PIECES = {
  p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
  P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔"
};

/* Draw board */
function drawBoard() {
  boardEl.innerHTML = "";
  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const squareDiv = document.createElement("div");
      const squareName = "abcdefgh"[c] + (8 - r);

      squareDiv.className =
        "square " + ((r + c) % 2 === 0 ? "light" : "dark");

      if (legalMoves.includes(squareName)) {
        squareDiv.classList.add("highlight");
      }

      const piece = board[r][c];
      if (piece) {
        const key =
          piece.color === "w"
            ? piece.type.toUpperCase()
            : piece.type;
        squareDiv.textContent = PIECES[key];
      }

      squareDiv.onclick = () => onSquareClick(squareName);
      boardEl.appendChild(squareDiv);
    }
  }

  updateStatus();
}

/* Handle square click */
function onSquareClick(square) {
  if (!selectedSquare) {
    const piece = game.get(square);
    if (!piece || piece.color !== game.turn()) return;

    selectedSquare = square;
    legalMoves = game.moves({ square, verbose: true }).map(m => m.to);
  } else {
    if (legalMoves.includes(square)) {
      const move = game.move({
        from: selectedSquare,
        to: square,
        promotion: "q"
      });

      if (move) {
        updateCaptured(move);
        socket.emit("move", game.fen());
      }
    }

    selectedSquare = null;
    legalMoves = [];
  }

  drawBoard();
}

/* Update captured pieces */
function updateCaptured(move) {
  if (!move.captured) return;

  const target =
    move.color === "w" ? capWhite : capBlack;

  const symbol =
    move.color === "w"
      ? PIECES[move.captured]
      : PIECES[move.captured.toUpperCase()];

  target.textContent += symbol;
}

/* Update status text */
function updateStatus() {
  let text = "";

  if (game.in_checkmate()) {
    text =
      "Checkmate! " +
      (game.turn() === "w" ? "Black" : "White") +
      " wins";
  } else if (game.in_stalemate()) {
    text = "Stalemate — Draw";
  } else if (game.in_check()) {
    text =
      (game.turn() === "w" ? "White" : "Black") +
      " is in CHECK";
  } else {
    text =
      (game.turn() === "w" ? "White" : "Black") +
      "'s Turn";
  }

  statusEl.textContent = text;
}

/* Receive opponent move */
socket.on("move", fen => {
  game.load(fen);
  drawBoard();
});

/* Initial render */
drawBoard();
