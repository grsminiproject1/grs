const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 1. Serve static files (CSS, JS, Images) from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// 2. Data store for rooms (tracks names and moves for persistence)
const rooms = {};

// 3. HOME PAGE ROUTE
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 4. DYNAMIC ROOM ROUTE (Fixes the "Cannot GET" error)
app.get("/room/:roomId", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "room.html"));
});

// 5. SOCKET.IO LOGIC
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Join a specific chess room
    socket.on("joinRoom", ({ room, name }) => {
        socket.join(room);
        socket.roomId = room;
        socket.userName = name;

        // Initialize room if it's new
        if (!rooms[room]) {
            rooms[room] = { w: null, b: null };
        }

        // Assign player roles based on join order
        if (!rooms[room].w) {
            rooms[room].w = name;
            socket.color = 'w';
        } else if (!rooms[room].b && rooms[room].w !== name) {
            rooms[room].b = name;
            socket.color = 'b';
        }

        // Sync player names to everyone in the room
        io.to(room).emit("playerUpdate", {
            w: rooms[room].w || "Waiting...",
            b: rooms[room].b || "Waiting..."
        });

        // Send system message to chat
        io.to(room).emit("chat", `📢 ${name} has joined the game.`);
    });

    // Handle Chess Moves
    socket.on("move", (data) => {
        // Broadcast the move (FEN and lastMove info) to the opponent
        socket.to(socket.roomId).emit("move", data);
    });

    // Handle Chat Messages
    socket.on("chat", (msg) => {
        if (msg.trim() !== "") {
            const formattedMsg = `${socket.userName || 'Anonymous'}: ${msg}`;
            io.to(socket.roomId).emit("chat", formattedMsg);
        }
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

// 6. START SERVER
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Server is running!`);
    console.log(`👉 http://localhost:${PORT}`);
});
