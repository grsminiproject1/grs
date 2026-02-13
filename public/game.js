const socket = io();
const room = location.pathname.split("/")[2];
socket.emit("joinRoom", room);

const game = new Chess();

const boardDiv = document.getElementById("board");
const statusDiv = document.getElementById("status");
const capWhite = document.getElementById("capWhite");
const capBlack = document.getElementById("capBlack");

let selectedSquare = null;
let validMoves = [];

const symbols = {
  p:"♟", r:"♜", n:"♞", b:"♝", q:"♛", k:"♚",
  P:"♙", R:"♖", N:"♘", B:"♗", Q:"♕", K:"♔"
};

function drawBoard() {
  boardDiv.innerHTML = "";
  const board = game.board();

  board.forEach((row, r) => {
    row.forEach((piece, c) => {
      const sq = document.createElement("div");
      const file = "abcdefgh"[c];
      const rank = 8 - r;
      const square = file + rank;

      sq.className = `square ${(r+c)%2===0?"light":"dark"}`;
      if (validMoves.includes(square)) sq.classList.add("highlight");

      if (piece) sq.textContent = symbols[piece.color === "w" ? piece.type.toUpperCase() : piece.type];

      sq.onclick = () => onSquareClick(square);
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
    if (validMoves.includes(square)) {
      const move = game.move({
        from: selectedSquare,
        to: square,
        promotion: "q"
      });

      socket.emit("move", game.fen());
      updateCaptured(move);
    }

    selectedSquare = null;
    validMoves = [];
  }
  drawBoard();
}

function updateCaptured(move) {
  if (!move || !move.captured) return;
  const el = move.color === "w" ? capWhite : capBlack;
  el.textContent += symbols[move.color === "w"
    ? move.captured
    : move.captured.toUpperCase()];
}

function updateStatus() {
  let text = "";
  if (game.in_checkmate()) {
    text = `Checkmate! ${game.turn()==="w"?"Black":"White"} wins`;
  } else if (game.in_stalemate()) {
    text = "Stalemate! Draw";
  } else if (game.in_check()) {
    text = `${game.turn()==="w"?"White":"Black"} in CHECK`;
  } else {
    text = `${game.turn()==="w"?"White":"Black"}'s Turn`;
  }
  statusDiv.textContent = text;
}

socket.on("move", fen => {
  game.load(fen);
  drawBoard();
});

drawBoard();
