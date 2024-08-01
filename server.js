const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const redis = require("redis");
const { promisify } = require("util");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

// Redis 초기화 코드
redisClient.flushall((err, succeeded) => {
  if (err) {
    console.error("Failed to clear Redis:", err);
  } else {
    console.log("Redis cleared:", succeeded);
  }
});

let totalRequests = 0;
let failures = 0;

// Redis 클라이언트에 프로미스 추가
redisClient.lrangeAsync = promisify(redisClient.lrange).bind(redisClient);
redisClient.hgetAsync = promisify(redisClient.hget).bind(redisClient);
redisClient.hsetAsync = promisify(redisClient.hset).bind(redisClient);
redisClient.rpushAsync = promisify(redisClient.rpush).bind(redisClient);

io.on("connection", async (socket) => {
  let userId = socket.handshake.query.userId;

  try {
    const messagesData = await redisClient.lrangeAsync("messages", 0, -1);
    const messages = messagesData.map((item) => JSON.parse(item));

    if (!userId) {
      // userId가 없을 경우 기본값 설정
      userId = `user${Math.floor(Math.random() * 1000000)}`;
    }

    const userData = await redisClient.hgetAsync("users", userId);
    if (userData) {
      const user = JSON.parse(userData);
      socket.createdAt = user.createdAt;
    } else {
      // 만약 사용자 데이터가 없다면, 기본값 설정
      socket.createdAt = new Date().toLocaleString();
      await redisClient.hsetAsync(
        "users",
        userId,
        JSON.stringify({
          createdAt: socket.createdAt,
        })
      );
    }

    socket.emit("welcome", {
      userId,
      createdAt: socket.createdAt,
      messages,
    });
  } catch (error) {
    console.error("Error during connection:", error);
  }

  socket.on("message", async (data) => {
    const messageData = {
      userId: userId,
      message: data.message,
    };
    const messageString = JSON.stringify(messageData);
    await redisClient.rpushAsync("messages", messageString);
    io.emit("message", messageData);
  });

  socket.on("request", () => {
    totalRequests++;
    if (Math.random() > 0.1) {
      // 90% 성공, 10% 실패
      socket.emit("response", { success: true });
    } else {
      failures++;
      socket.emit("response", { success: false });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// 초당 통계를 클라이언트에 전송
setInterval(() => {
  io.emit("stats", {
    totalRequests,
    failures,
  });
  // 초당 통계 초기화
  totalRequests = 0;
  failures = 0;
}, 1000);

server.listen(3000, () => {
  console.log("Listening on port 3000");
});

function randomNameGenerator() {
  return "User" + Math.floor(Math.random() * 1000000);
}
