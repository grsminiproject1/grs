const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/room/:roomId", (req, res) => {
    res.sendFile(path.join(__dirname, "public/room.html"));
});

io.on("connection", socket => {

    socket.on("joinRoom", roomId => {
        socket.join(roomId);
        socket.roomId = roomId;
        socket.to(roomId).emit("system", "Opponent joined");
    });

    socket.on("move", data => {
        socket.to(socket.roomId).emit("move", data);
    });

    socket.on("chat", msg => {
        if (!msg || !socket.roomId) return;
        io.to(socket.roomId).emit("chat", msg);
    });

    socket.on("disconnect", () => {
        if (socket.roomId)
            socket.to(socket.roomId).emit("system", "Opponent left");
    });
});

server.listen(3000, () => console.log("Server running on 3000"));
