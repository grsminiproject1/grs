const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const rooms = {};

// ===== generate room + code =====
function generateRoomId() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let roomId = "";
    for (let i = 0; i < 6; i++) {
        roomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return roomId;
}

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ===== create game =====
app.get("/create-game", (req, res) => {
    let roomId;
    do {
        roomId = generateRoomId();
    } while (rooms[roomId]);

    const code = generateCode();

    rooms[roomId] = {
        code,
        players: []
    };

    res.json({ roomId, code });
});

// ===== routes =====
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/room/:roomId", (req, res) => {
    res.sendFile(path.join(__dirname, "public/room.html"));
});

// ===== sockets =====
io.on("connection", (socket) => {

    // 🔐 verify join
    socket.on("verifyAndJoin", ({ roomId, code }) => {
        const room = rooms[roomId];

        if (!room) {
            socket.emit("verificationFailed", "Room does not exist");
            return;
        }

        if (room.code !== code) {
            socket.emit("verificationFailed", "Invalid code");
            return;
        }

        if (room.players.length >= 2) {
            socket.emit("verificationFailed", "Room full");
            return;
        }

        socket.join(roomId);
        socket.roomId = roomId;
        room.players.push(socket.id);

        // assign color
        const color = room.players.length === 1 ? "w" : "b";
        socket.emit("color", color);

        socket.emit("verificationSuccess");
        socket.to(roomId).emit("system", "Opponent joined");
    });

    // ♟ chess move
    socket.on("move", data => {
        if (socket.roomId)
            socket.to(socket.roomId).emit("move", data);
    });

    // 💬 chat
    socket.on("chat", msg => {
        if (socket.roomId)
            io.to(socket.roomId).emit("chat", msg);
    });

    socket.on("disconnect", () => {
        if (!socket.roomId) return;

        const room = rooms[socket.roomId];
        if (room) {
            room.players = room.players.filter(id => id !== socket.id);
        }

        socket.to(socket.roomId).emit("system", "Opponent left");
    });
});

server.listen(3000, () => console.log("Server running on 3000"));
