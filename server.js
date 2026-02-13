const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.get("/create", (req, res) => {
  res.redirect(`/room/${uuidv4()}`);
});

app.get("/room/:id", (req, res) => {
  res.sendFile(__dirname + "/public/room.html");
});

io.on("connection", socket => {
  socket.on("joinRoom", ({ room, name }) => {
    socket.join(room);
    socket.room = room;
    socket.name = name;
    io.to(room).emit("system", `${name} joined the room`);
  });

  socket.on("move", fen => {
    socket.to(socket.room).emit("move", fen);
  });

  socket.on("chat", msg => {
    io.to(socket.room).emit("chat", msg);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log("Server running"));
