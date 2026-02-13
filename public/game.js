const socket = io();
const boardDiv = document.getElementById("board");
const roomId = window.location.pathname.split("/")[2];
document.getElementById("roomLink").value = window.location.href;

socket.emit("joinRoom", roomId);

let turn = "white";
let selected = null;

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

const pieces = { wp:"♙", bp:"♟" };

function drawBoard() {
    boardDiv.innerHTML = "";
    board.forEach((row,r) => {
        row.forEach((cell,c) => {
            const sq = document.createElement("div");
            sq.className = `square ${(r+c)%2===0?"white":"black"}`;
            sq.onclick = () => onSquareClick(r,c);
            if(cell!=="--") sq.textContent = pieces[cell];
            boardDiv.appendChild(sq);
        });
    });
}

function onSquareClick(r,c) {
    clearHighlights();

    if(board[r][c] !== "--" && isMyTurn(board[r][c])) {
        selected = {r,c};
        showPawnMoves(r,c);
    } else if(selected) {
        move(selected.r, selected.c, r, c);
    }
}

function showPawnMoves(r,c) {
    const dir = board[r][c]==="wp"?-1:1;
    if(board[r+dir] && board[r+dir][c]==="--") highlight(r+dir,c);
}

function highlight(r,c) {
    boardDiv.children[r*8+c].classList.add("highlight");
}

function clearHighlights() {
    document.querySelectorAll(".highlight").forEach(s=>s.classList.remove("highlight"));
}

function move(sr,sc,tr,tc) {
    board[tr][tc] = board[sr][sc];
    board[sr][sc] = "--";
    selected = null;
    turn = turn==="white"?"black":"white";
    drawBoard();
    socket.emit("move",{board,turn});
}

socket.on("move",(data)=>{
    board = data.board;
    turn = data.turn;
    drawBoard();
});

function isMyTurn(piece) {
    return (turn==="white" && piece==="wp") || (turn==="black" && piece==="bp");
}

/* CHAT */
function sendMessage() {
    const msg = document.getElementById("msg");
    socket.emit("chatMessage", msg.value);
    msg.value="";
}

socket.on("chatMessage",(m)=>{
    const li=document.createElement("li");
    li.textContent=m;
    document.getElementById("messages").appendChild(li);
});

drawBoard();
