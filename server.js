const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

/* ---------------- AUTH STORAGE ---------------- */
const rooms = {}; // { roomId: { code: "123456" } }

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

/* ---------------- ROUTES ---------------- */

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

/* Create room */
app.get("/create-room", (req, res) => {
    let roomId;
    do {
        roomId = generateRoomId();
    } while (rooms[roomId]);

    const code = generateCode();
    rooms[roomId] = { code };

    res.json({ roomId, code });
});

/* Serve room page */
app.get("/room/:roomId", (req, res) => {
    res.sendFile(path.join(__dirname, "public/room.html"));
});

/* ---------------- SOCKET ---------------- */

io.on("connection", socket => {

    /* AUTH VERIFY */
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

        socket.join(roomId);
        socket.roomId = roomId;

        socket.emit("verificationSuccess");
        socket.to(roomId).emit("system", "Opponent joined");
    });

    /* MOVE (UNCHANGED) */
    socket.on("move", data => {
        socket.to(socket.roomId).emit("move", data);
    });

    /* CHAT (UNCHANGED) */
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
