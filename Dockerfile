# Node.js 베이스 이미지 사용
FROM node:14

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 파일을 복사
COPY package*.json ./

# 종속성 설치
RUN npm install

# 현재 디렉토리의 모든 파일을 작업 디렉토리로 복사
COPY . .

# 애플리케이션 시작 명령어
CMD ["node", "server.js"]

# 앱 포트 노출
EXPOSE 3000
