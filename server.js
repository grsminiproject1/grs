const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Chess } = require("chess.js");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const games = {}; // roomId -> Chess instance

io.on("connection", (socket) => {

    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        socket.roomId = roomId;

        if (!games[roomId]) {
            games[roomId] = new Chess();
        }

        socket.emit("gameState", games[roomId].fen());
        socket.to(roomId).emit("system", "Opponent joined");
    });

    socket.on("move", ({ from, to }) => {
        const game = games[socket.roomId];
        if (!game) return;

        const move = game.move({ from, to, promotion: "q" });
        if (!move) return; // illegal move ignored

        io.to(socket.roomId).emit("gameState", game.fen());
    });

    socket.on("chatMessage", (msg) => {
        if (!socket.roomId || !msg.trim()) return;
        io.to(socket.roomId).emit("chatMessage", msg.trim());
    });

    socket.on("disconnect", () => {
        if (socket.roomId) {
            socket.to(socket.roomId).emit("system", "Opponent disconnected");
        }
    });
});

server.listen(3000, () => console.log("Server running"));
