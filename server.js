const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

/* =====================
   ROOM + AUTH LOGIC
===================== */
const rooms = {};

function generateRoomId() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";
    for (let i = 0; i < 6; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/* =====================
   ROUTES
===================== */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/create-room", (req, res) => {
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

app.get("/room/:roomId", (req, res) => {
    res.sendFile(path.join(__dirname, "public/room.html"));
});

/* =====================
   SOCKET.IO
===================== */
io.on("connection", socket => {

    socket.on("verifyAndJoin", ({ roomId, code }) => {
        const room = rooms[roomId];

        if (!room) {
            socket.emit("verificationFailed", "Room does not exist");
            return;
        }

        if (room.code !== code) {
            socket.emit("verificationFailed", "Invalid verification code");
            return;
        }

        if (room.players.length >= 2) {
            socket.emit("verificationFailed", "Room is full");
            return;
        }

        socket.join(roomId);
        socket.roomId = roomId;
        room.players.push(socket.id);

        socket.emit("verificationSuccess");
        socket.to(roomId).emit("system", "Opponent joined");
    });

    socket.on("move", data => {
        if (socket.roomId)
            socket.to(socket.roomId).emit("move", data);
    });

    socket.on("chat", msg => {
        if (socket.roomId && msg)
            io.to(socket.roomId).emit("chat", msg);
    });

    socket.on("disconnect", () => {
        if (!socket.roomId) return;

        const room = rooms[socket.roomId];
        if (room) {
            room.players = room.players.filter(id => id !== socket.id);
            socket.to(socket.roomId).emit("system", "Opponent left");

            if (room.players.length === 0) {
                delete rooms[socket.roomId]; // cleanup
            }
        }
    });
});

server.listen(3000, () => console.log("Server running on 3000"));
