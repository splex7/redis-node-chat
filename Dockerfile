FROM node:14

WORKDIR /app

# package.json과 package-lock.json만 복사하여 의존성을 설치합니다.
COPY package*.json ./
RUN npm install

# 나머지 애플리케이션 파일을 복사합니다.
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
