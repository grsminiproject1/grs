const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

/* -------------------- STATIC FILES -------------------- */
app.use(express.static(path.join(__dirname, "public")));

/* -------------------- HOME -------------------- */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* -------------------- CREATE ROOM -------------------- */
app.get("/create", (req, res) => {
  const roomId = uuidv4();
  res.redirect(`/room/${roomId}`);
});

/* -------------------- JOIN ROOM -------------------- */
app.get("/room/:room", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "room.html"));
});

/* -------------------- SOCKET LOGIC -------------------- */
const roomPlayers = {}; // { roomId: [socketId1, socketId2] }

io.on("connection", socket => {
  console.log("User connected:", socket.id);

  /* ----- JOIN ROOM ----- */
  socket.on("joinRoom", ({ room, name }) => {
    socket.join(room);

    if (!roomPlayers[room]) roomPlayers[room] = [];

    // Prevent more than 2 players
    if (roomPlayers[room].length >= 2) {
      socket.emit("chat", "Room is full");
      return;
    }

    roomPlayers[room].push(socket.id);

    // Assign color
    const color = roomPlayers[room].length === 1 ? "w" : "b";
    socket.emit("assignColor", color);

    io.to(room).emit("chat", `${name} joined the room`);
    console.log(`${name} joined room ${room} as ${color}`);
  });

  /* ----- HANDLE MOVES ----- */
  socket.on("move", fen => {
    const rooms = [...socket.rooms].filter(r => r !== socket.id);
    if (rooms.length > 0) {
      socket.to(rooms[0]).emit("move", fen);
    }
  });

  /* ----- CHAT ----- */
  socket.on("chat", msg => {
    const rooms = [...socket.rooms].filter(r => r !== socket.id);
    if (rooms.length > 0) {
      io.to(rooms[0]).emit("chat", msg);
    }
  });

  /* ----- DISCONNECT ----- */
  socket.on("disconnect", () => {
    for (const room in roomPlayers) {
      roomPlayers[room] = roomPlayers[room].filter(id => id !== socket.id);
      if (roomPlayers[room].length === 0) delete roomPlayers[room];
    }
    console.log("User disconnected:", socket.id);
  });
});

/* -------------------- START SERVER -------------------- */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
