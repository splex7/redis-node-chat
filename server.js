const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const redis = require("redis");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
});

// Redis 초기화 코드
redisClient.flushall((err, succeeded) => {
  if (err) {
    console.error("Failed to clear Redis:", err);
  } else {
    console.log("Redis cleared:", succeeded);
  }
});

let anonymousCounter = 0;

io.on("connection", (socket) => {
  let userId = socket.handshake.query.userId;

  redisClient.lrange("messages", 0, -1, (err, data) => {
    const messages = data.map((item) => JSON.parse(item));

    if (userId) {
      redisClient.hget("users", userId, (err, userData) => {
        if (userData) {
          const user = JSON.parse(userData);
          socket.username = user.username;
          socket.createdAt = user.createdAt;
        } else {
          // 만약 사용자 데이터가 없다면, 기본값 설정
          socket.username = `익명의유저${Math.floor(Math.random() * 1000000)}`;
          socket.createdAt = new Date().toLocaleString();
          redisClient.hset(
            "users",
            userId,
            JSON.stringify({
              username: socket.username,
              createdAt: socket.createdAt,
            })
          );
        }
        socket.emit("welcome", {
          userId,
          name: socket.username,
          createdAt: socket.createdAt,
          messages,
        });
      });
    } else {
      // userId가 없을 경우 기본값 설정
      socket.username = `익명의유저${Math.floor(Math.random() * 1000000)}`;
      socket.createdAt = new Date().toLocaleString();
      userId = `user${Math.floor(Math.random() * 1000000)}`;
      redisClient.hset(
        "users",
        userId,
        JSON.stringify({
          username: socket.username,
          createdAt: socket.createdAt,
        })
      );
      socket.emit("welcome", {
        userId,
        name: socket.username,
        createdAt: socket.createdAt,
        messages,
      });
    }
  });

  socket.on("setNickname", (data) => {
    if (data.username) {
      socket.username = data.username;
      redisClient.hset(
        "users",
        userId,
        JSON.stringify({
          username: socket.username,
          createdAt: socket.createdAt,
        })
      );
      socket.emit("nicknameSet", {
        userId,
        name: socket.username,
        createdAt: socket.createdAt,
      });
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
