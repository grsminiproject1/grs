const boardElement = document.getElementById("board");

let selectedPiece = null;
let selectedIndex = null;

/* BOARD MATRIX */
let board = [
    ["bp","bp","bp","bp","bp","bp","bp","bp"],
    ["--","--","--","--","--","--","--","--"],
    ["--","--","--","--","--","--","--","--"],
    ["--","--","--","--","--","--","--","--"],
    ["--","--","--","--","--","--","--","--"],
    ["--","--","--","--","--","--","--","--"],
    ["wp","wp","wp","wp","wp","wp","wp","wp"],
    ["--","--","--","--","--","--","--","--"]
];

/* UNICODE PIECES */
const pieces = {
    wp: "♙",
    bp: "♟"
};

function drawBoard() {
    boardElement.innerHTML = "";

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement("div");
            square.className = "square " + ((r + c) % 2 === 0 ? "white" : "black");
            square.dataset.index = r * 8 + c;

            if (board[r][c] !== "--") {
                square.textContent = pieces[board[r][c]];
            }

            square.onclick = () => onSquareClick(r, c, square);
            boardElement.appendChild(square);
        }
    }
}

function onSquareClick(r, c, square) {
    clearHighlights();

    if (board[r][c] !== "--") {
        selectedPiece = board[r][c];
        selectedIndex = { r, c };
        showMoves(r, c, selectedPiece);
    } else if (selectedPiece) {
        movePiece(r, c);
    }
}

function showMoves(r, c, piece) {
    let direction = piece === "wp" ? -1 : 1;
    let nextRow = r + direction;

    if (board[nextRow] && board[nextRow][c] === "--") {
        highlightSquare(nextRow, c);
    }
}

function movePiece(r, c) {
    board[selectedIndex.r][selectedIndex.c] = "--";
    board[r][c] = selectedPiece;
    selectedPiece = null;
    selectedIndex = null;
    drawBoard();
}

function highlightSquare(r, c) {
    const index = r * 8 + c;
    boardElement.children[index].classList.add("highlight");
}

function clearHighlights() {
    document.querySelectorAll(".highlight").forEach(s => s.classList.remove("highlight"));
}

drawBoard();

/* CHAT TOGGLE */
function toggleChat() {
    document.getElementById("chatBox").classList.toggle("hidden");
}
