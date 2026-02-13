const boardElement = document.getElementById("board");

/* 8x8 matrix */
const board = [
    ["bp","bp","bp","bp","bp","bp","bp","bp"],
    ["--","--","--","--","--","--","--","--"],
    ["--","--","--","--","--","--","--","--"],
    ["--","--","--","--","--","--","--","--"],
    ["--","--","--","--","--","--","--","--"],
    ["--","--","--","--","--","--","--","--"],
    ["wp","wp","wp","wp","wp","wp","wp","wp"],
    ["--","--","--","--","--","--","--","--"]
];

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

            if (board[r][c] !== "--") {
                square.textContent = pieces[board[r][c]];
            }

            boardElement.appendChild(square);
        }
    }
}

drawBoard();
