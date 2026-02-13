const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/room/:roomId", (req, res) => {
    res.sendFile(__dirname + "/public/room.html");
});

io.on("connection", (socket) => {

    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        socket.roomId = roomId;
        socket.to(roomId).emit("playerJoined");
    });

    socket.on("chatMessage", (msg) => {
        io.to(socket.roomId).emit("chatMessage", msg);
    });

    socket.on("move", (data) => {
        socket.to(socket.roomId).emit("move", data);
    });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on", PORT));
