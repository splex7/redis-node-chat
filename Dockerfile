# Node.js 이미지를 기반으로 합니다 (Debian)
FROM node:20

# 작업 디렉토리를 설정합니다.
WORKDIR /app

# package.json 파일을 복사합니다.
COPY package.json ./

# yarn을 전역으로 설치합니다.
RUN npm install -g yarn

# yarn을 사용하여 종속성을 설치합니다.
RUN yarn install

# 나머지 애플리케이션 코드를 복사합니다.
COPY . .

# 포트를 노출합니다.
EXPOSE 3000

# 애플리케이션을 시작합니다.
CMD ["node", "server.js"]
