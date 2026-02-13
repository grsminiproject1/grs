const socket = io();
const room = location.pathname.split("/")[2];
socket.emit("joinRoom", room);
document.getElementById("roomLink").value = location.href;

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

let turn = "white";
let selected = null;
let validMoves = [];

const pieces = {
  wp:"♙",wr:"♖",wn:"♘",wb:"♗",wq:"♕",wk:"♔",
  bp:"♟",br:"♜",bn:"♞",bb:"♝",bq:"♛",bk:"♚"
};

function draw() {
  const b = document.getElementById("board");
  b.innerHTML = "";
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    const d = document.createElement("div");
    d.className = "cell " + ((r+c)%2?"black":"white");
    if (validMoves.some(m=>m.r===r&&m.c===c)) d.classList.add("highlight");
    d.innerText = pieces[board[r][c]] || "";
    d.onclick = ()=>click(r,c);
    b.appendChild(d);
  }
}

function click(r,c){
  if (selected) {
    if (validMoves.some(m=>m.r===r&&m.c===c)) move(selected.r,selected.c,r,c);
    selected=null; validMoves=[]; draw(); return;
  }
  if (board[r][c]==="--") return;
  if ((turn==="white" && board[r][c][0]!=="w") ||
      (turn==="black" && board[r][c][0]!=="b")) return;
  selected={r,c};
  validMoves=getValidMoves(r,c);
  draw();
}

function move(sr,sc,tr,tc){
  board[tr][tc]=board[sr][sc];
  board[sr][sc]="--";
  turn=turn==="white"?"black":"white";
  socket.emit("move",{board,turn});
  draw();
}

socket.on("move",data=>{
  board=data.board; turn=data.turn; draw();
});

function toggleChat(){
  chat.hidden=!chat.hidden;
}
function sendMsg(){
  socket.emit("chat",msg.value);
  msg.value="";
}
socket.on("chat",m=>{
  const li=document.createElement("li");
  li.innerText=m;
  messages.appendChild(li);
});

/* ======= CHESS RULES ======= */

function getValidMoves(r,c,test=board,skip=false){
  let p=test[r][c],color=p[0],t=p[1],m=[];
  const push=(rr,cc)=>{ if(rr>=0&&rr<8&&cc>=0&&cc<8&&(test[rr][cc]=="--"||test[rr][cc][0]!=color)) m.push({r:rr,c:cc}); };

  if(t=="p"){
    let d=color=="w"?-1:1;
    if(test[r+d]&&test[r+d][c]=="--") push(r+d,c);
    [-1,1].forEach(x=>{
      if(test[r+d]&&test[r+d][c+x]&&test[r+d][c+x][0]&&!test[r+d][c+x].startsWith(color))
        push(r+d,c+x);
    });
  }
  if(t=="r"||t=="q"){
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{
      for(let i=1;i<8;i++){
        let rr=r+d[0]*i,cc=c+d[1]*i;
        if(rr<0||rr>7||cc<0||cc>7) break;
        if(test[rr][cc]=="--") m.push({r:rr,c:cc});
        else { if(test[rr][cc][0]!=color)m.push({r:rr,c:cc}); break; }
      }
    });
  }
  if(t=="b"||t=="q"){
    [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(d=>{
      for(let i=1;i<8;i++){
        let rr=r+d[0]*i,cc=c+d[1]*i;
        if(rr<0||rr>7||cc<0||cc>7) break;
        if(test[rr][cc]=="--") m.push({r:rr,c:cc});
        else { if(test[rr][cc][0]!=color)m.push({r:rr,c:cc}); break; }
      }
    });
  }
  if(t=="n"){
    [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]
    .forEach(d=>push(r+d[0],c+d[1]));
  }
  if(t=="k"){
    for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)
      if(dr||dc)push(r+dr,c+dc);
  }

  if(skip) return m;
  return m.filter(x=>{
    let copy=JSON.parse(JSON.stringify(test));
    copy[x.r][x.c]=copy[r][c];
    copy[r][c]="--";
    return !inCheck(color,copy);
  });
}

function inCheck(color,b){
  let kr,kc;
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)
    if(b[r][c]==color+"k"){kr=r;kc=c;}
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)
    if(b[r][c][0]&&b[r][c][0]!=color)
      if(getValidMoves(r,c,b,true).some(m=>m.r==kr&&m.c==kc))
        return true;
  return false;
}

draw();
