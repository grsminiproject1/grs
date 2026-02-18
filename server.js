const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

/* ===== STATIC ===== */
app.use(express.static(path.join(__dirname, "public")));

/* ===== MEMORY ROOMS ===== */
const rooms = {};

/* ===== GENERATORS ===== */
function generateRoomId() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";
    for (let i = 0; i < 6; i++)
        id += chars[Math.floor(Math.random() * chars.length)];
    return id;
}

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/* ===== CREATE GAME ===== */
app.get("/create-game", (req, res) => {
    try {
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
    } catch (e) {
        console.error("CREATE GAME ERROR:", e);
        res.status(500).send("Server error");
    }
});

/* ===== ROOM PAGE ===== */
app.get("/room/:roomId", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "room.html"));
});

/* ===== SOCKET ===== */
io.on("connection", (socket) => {

    /* VERIFY JOIN */
    socket.on("verifyAndJoin", ({ roomId, code }) => {
        try {
            if (!roomId || !rooms[roomId]) {
                socket.emit("verificationFailed", "Room expired");
                return;
            }

            const room = rooms[roomId];

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

            const color = room.players.length === 1 ? "w" : "b";
            socket.emit("color", color);

            socket.emit("verificationSuccess");
            socket.to(roomId).emit("system", "Opponent joined");

        } catch (err) {
            console.error("VERIFY ERROR:", err);
        }
    });

    /* CHESS MOVE */
    socket.on("move", data => {
        if (socket.roomId)
            socket.to(socket.roomId).emit("move", data);
    });

    /* CHAT */
    socket.on("chat", msg => {
        if (socket.roomId)
            io.to(socket.roomId).emit("chat", msg);
    });

    /* DISCONNECT */
    socket.on("disconnect", () => {
        if (!socket.roomId) return;

        const room = rooms[socket.roomId];
        if (room)
            room.players = room.players.filter(id => id !== socket.id);

        socket.to(socket.roomId).emit("system", "Opponent left");
    });
});

/* ===== CRASH GUARD ===== */
process.on("uncaughtException", err => {
    console.error("UNCAUGHT:", err);
});

/* ===== START ===== */
server.listen(PORT, () =>
    console.log("Server running on", PORT)
);
