const roomPlayers = {}; // { roomId: { w: name, b: name } }

io.on("connection", (socket) => {
    socket.on("joinRoom", ({ room, name }) => {
        socket.join(room);
        socket.roomId = room;

        if (!roomPlayers[room]) roomPlayers[room] = { w: null, b: null };
        
        // Assign color
        if (!roomPlayers[room].w) roomPlayers[room].w = name;
        else if (!roomPlayers[room].b) roomPlayers[room].b = name;

        io.to(room).emit("playerUpdate", roomPlayers[room]);
        io.to(room).emit("chat", `${name} joined the game.`);
    });

    socket.on("move", (data) => {
        socket.to(socket.roomId).emit("move", data);
    });

    socket.on("chat", (msg) => {
        io.to(socket.roomId).emit("chat", msg);
    });
});
