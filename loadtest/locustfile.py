from locust import User, TaskSet, task, between
import socketio
import random
import string

class SocketIOClient:

    def __init__(self, url):
        self.sio = socketio.Client()
        self.url = url

    def connect(self, user_id):
        self.sio.connect(self.url, transports=['websocket', 'polling'])
        self.user_id = user_id
        self.sio.emit('join', {'userId': user_id})

    def send_message(self, message):
        self.sio.emit('message', {'message': message}, namespace='/')

    def set_nickname(self, username):
        self.sio.emit('setNickname', {'username': username}, namespace='/')

    def close(self):
        self.sio.disconnect()

class UserBehavior(TaskSet):

    messages = [
        "안녕하세요!",
        "반갑습니다!",
        "오늘 날씨 좋네요!",
        "어디서 오셨어요?",
        "점심 뭐 드셨어요?",
        "주말 잘 보내세요!",
        "좋은 하루 되세요!",
        "다음에 또 만나요!",
        "이거 정말 재밌네요!",
        "어떻게 지내세요?",
        "저도 그렇게 생각해요.",
        "알겠습니다.",
        "감사합니다.",
        "잘 부탁드립니다.",
        "수고하세요!",
        "조심히 들어가세요.",
        "금방 다녀올게요.",
        "잠깐 나갔다 올게요.",
        "지금 뭐하고 계세요?",
        "바쁘신가요?",
        "어제 뭐했어요?",
        "오늘 뭐할 거예요?",
        "좋아요!",
        "싫어요...",
        "그렇군요.",
        "ㅋㅋㅋ",
        "ㅎㅎㅎ",
        "아, 그렇군요.",
        "그럴 수 있죠.",
        "그게 무슨 말이죠?",
        "정말요?",
        "대박!",
        "헐...",
        "아니에요.",
        "네, 맞아요.",
        "아, 네.",
        "그럴까요?",
        "그럼요.",
        "저도요!",
        "그게 좋겠네요.",
        "저도 그렇게 생각해요.",
        "아, 그렇군요.",
        "그럴 수 있죠.",
        "그게 무슨 말이죠?",
        "정말요?",
        "대박!",
        "헐...",
        "아니에요.",
        "네, 맞아요.",
    ]

    def generate_message(self):
        return random.choice(self.messages)

    def on_start(self):
        self.user_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        self.username = 'User' + ''.join(random.choices(string.digits, k=4))
        self.ws_client = SocketIOClient("http://localhost:3000")
        self.ws_client.connect(self.user_id)
        self.ws_client.set_nickname(self.username)

    @task(1)
    def send_message(self):
        message = self.generate_message()
        self.ws_client.send_message(message)

    @task(1)
    def set_nickname(self):
        new_username = 'User' + ''.join(random.choices(string.digits, k=4))
        self.ws_client.set_nickname(new_username)

    def on_stop(self):
        self.ws_client.close()

class WebsiteUser(User):
    tasks = [UserBehavior]
    wait_time = between(1, 3)
