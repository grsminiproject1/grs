const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static("public"));

// Create room
app.get("/create", (req, res) => {
    const roomId = uuidv4();
    res.redirect(`/room/${roomId}`);
});

// Room page
app.get("/room/:roomId", (req, res) => {
    res.sendFile(__dirname + "/public/room.html");
});

io.on("connection", (socket) => {

    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        socket.roomId = roomId;
        console.log("User joined room:", roomId);
    });

    socket.on("move", (data) => {
        socket.to(data.roomId).emit("move", data.move);
    });

    socket.on("chatMessage", (msg) => {
        io.to(socket.roomId).emit("chatMessage", msg);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
