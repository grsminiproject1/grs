const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// Store room data in memory (State Persistence)
const rooms = {}; 

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("joinRoom", ({ room, name }) => {
        socket.join(room);
        socket.roomId = room;
        socket.userName = name;

        // Initialize room if it doesn't exist
        if (!rooms[room]) {
            rooms[room] = { w: null, b: null, moves: [] };
        }

        // Assign colors based on who joins first
        if (!rooms[room].w) {
            rooms[room].w = name;
            socket.color = 'w';
        } else if (!rooms[room].b) {
            rooms[room].b = name;
            socket.color = 'b';
        }

        // Notify everyone in the room about the updated player list
        io.to(room).emit("playerUpdate", {
            w: rooms[room].w,
            b: rooms[room].b
        });

        // Send a system message to the chat
        io.to(room).emit("chat", `${name} has joined the room.`);
    });

    // Handle Chess Moves
    socket.on("move", (data) => {
        // Broadcast the move to everyone else in the same room
        socket.to(socket.roomId).emit("move", data);
    });

    // Handle Chat Messages
    socket.on("chat", (msg) => {
        const formattedMsg = `${socket.userName || 'Anonymous'}: ${msg}`;
        io.to(socket.roomId).emit("chat", formattedMsg);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
        // Optional: Logic to clear room if both players leave
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
