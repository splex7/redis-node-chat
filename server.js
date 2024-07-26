const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const redis = require("redis");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Redis 클라이언트 생성
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
});

let anonymousCounter = 0;

io.on("connection", (socket) => {
  let userId = socket.handshake.query.userId;

  // Redis에서 채팅 기록 가져오기
  redisClient.lrange("messages", 0, -1, (err, data) => {
    const messages = data.map((item) => JSON.parse(item));

    if (userId) {
      redisClient.hget("users", userId, (err, username) => {
        if (username) {
          socket.username = username;
        } else {
          anonymousCounter++;
          socket.username = `익명의유저${anonymousCounter}`;
          userId = `user${anonymousCounter}`;
          redisClient.hset("users", userId, socket.username);
        }
        socket.emit("welcome", { userId, name: socket.username, messages });
      });
    } else {
      anonymousCounter++;
      socket.username = `익명의유저${anonymousCounter}`;
      userId = `user${anonymousCounter}`;
      redisClient.hset("users", userId, socket.username);
      socket.emit("welcome", { userId, name: socket.username, messages });
    }
  });

  socket.on("message", (data) => {
    const messageData = { name: socket.username, message: data.message };
    const messageString = JSON.stringify(messageData);
    redisClient.rpush("messages", messageString);
    io.emit("message", messageData);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

server.listen(3000, () => {
  console.log("Listening on port 3000");
});
