//const socket = io();
const roomId = location.pathname.split("/")[2];
document.getElementById("roomLink").value = location.href;
//socket.emit("joinRoom", roomId);

const boardDiv = document.getElementById("board");
const messages = document.getElementById("messages");

const PIECES = {
    wp:"♙", wr:"♖", wn:"♘", wb:"♗", wq:"♕", wk:"♔",
    bp:"♟", br:"♜", bn:"♞", bb:"♝", bq:"♛", bk:"♚"
};

let board = [
 ["br","bn","bb","bq","bk","bb","bn","br"],
 ["bp","bp","bp","bp","bp","bp","bp","bp"],
 ["--","--","--","--","--","--","--","--"],
 ["--","--","--","--","--","--","--","--"],
 ["--","--","--","--","--","--","--","--"],
 ["--","--","--","--","--","--","--","--"],
 ["wp","wp","wp","wp","wp","wp","wp","wp"],
 ["wr","wn","wb","wq","wk","wb","wn","wr"]
];

let selected = null;
let turn = "w";

const inBounds = (r,c)=>r>=0&&r<8&&c>=0&&c<8;

function drawBoard() {
    boardDiv.innerHTML="";
    board.forEach((row,r)=>{
        row.forEach((cell,c)=>{
            const sq=document.createElement("div");
            sq.className=`square ${(r+c)%2?"dark":"light"}`;
            if(cell!=="--") sq.textContent=PIECES[cell];
            sq.onclick=()=>clickSquare(r,c);
            boardDiv.appendChild(sq);
        });
    });
}

function clickSquare(r,c){
    clearMarks();

    if(selected){
        if(getMoves(selected.r,selected.c)
            .some(m=>m[0]===r&&m[1]===c)){
            board[r][c]=board[selected.r][selected.c];
            board[selected.r][selected.c]="--";
            turn=turn==="w"?"b":"w";
            socket.emit("move",{board,turn});
        }
        selected=null;
        drawBoard();
        return;
    }

    if(board[r][c]!=="--" && board[r][c][0]===turn){
        selected={r,c};
        markMoves(getMoves(r,c));
    }
}

function getMoves(r,c){
    const p=board[r][c];
    const t=p[0], k=p[1];
    if(k==="p") return pawn(r,c,t);
    if(k==="r") return slide(r,c,[[1,0],[-1,0],[0,1],[0,-1]]);
    if(k==="b") return slide(r,c,[[1,1],[1,-1],[-1,1],[-1,-1]]);
    if(k==="q") return slide(r,c,[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]);
    if(k==="n") return knight(r,c);
    if(k==="k") return king(r,c);
}

function pawn(r,c,t){
    const d=t==="w"?-1:1, s=t==="w"?6:1, m=[];
    if(inBounds(r+d,c)&&board[r+d][c]==="--") m.push([r+d,c]);
    if(r===s&&board[r+d][c]==="--"&&board[r+2*d][c]==="--") m.push([r+2*d,c]);
    [[-1,1]].forEach;
    for(let dc of [-1,1]){
        let nr=r+d,nc=c+dc;
        if(inBounds(nr,nc)&&board[nr][nc]!=="--"&&board[nr][nc][0]!==t)
            m.push([nr,nc]);
    }
    return m;
}

function slide(r,c,dirs){
    const m=[], t=board[r][c][0];
    for(let[d1,d2] of dirs){
        let nr=r+d1,nc=c+d2;
        while(inBounds(nr,nc)){
            if(board[nr][nc]==="--") m.push([nr,nc]);
            else {
                if(board[nr][nc][0]!==t) m.push([nr,nc]);
                break;
            }
            nr+=d1; nc+=d2;
        }
    }
    return m;
}

function knight(r,c){
    const d=[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
    return d.map(x=>[r+x[0],c+x[1]])
        .filter(p=>inBounds(p[0],p[1])&&(board[p[0]][p[1]]==="--"||board[p[0]][p[1]][0]!==board[r][c][0]));
}

function king(r,c){
    const m=[];
    for(let dr=-1;dr<=1;dr++)
        for(let dc=-1;dc<=1;dc++)
            if(dr||dc){
                let nr=r+dr,nc=c+dc;
                if(inBounds(nr,nc)&&(board[nr][nc]==="--"||board[nr][nc][0]!==board[r][c][0]))
                    m.push([nr,nc]);
            }
    return m;
}

function markMoves(m){
    m.forEach(([r,c])=>boardDiv.children[r*8+c].classList.add("move"));
}

function clearMarks(){
    document.querySelectorAll(".move,.selected")
        .forEach(e=>e.classList.remove("move","selected"));
}

/* SOCKET */
socket.on("move", data=>{
    board=data.board;
    turn=data.turn;
    drawBoard();
});

/* CHAT */
function sendMessage(){
    const i=document.getElementById("msg");
    socket.emit("chat", i.value);
    i.value="";
}

socket.on("chat", msg=>{
    const li=document.createElement("li");
    li.textContent=msg;
    messages.appendChild(li);
});

socket.on("system", msg=>{
    const li=document.createElement("li");
    li.style.color="gray";
    li.textContent="[SYSTEM] "+msg;
    messages.appendChild(li);
});

drawBoard();
