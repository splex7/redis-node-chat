# 예시 Dockerfile
FROM node:14

WORKDIR /app

# 필요한 파일을 복사합니다.
COPY package*.json ./
COPY . .

# 종속성을 설치합니다.
RUN npm install

# 앱을 빌드합니다.
RUN npm run build

# 앱을 시작합니다.
CMD ["node", "server.js"]
