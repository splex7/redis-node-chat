from locust import HttpUser, TaskSet, task, between
import socketio
import random
import string
import json

class SocketIOClient:

    def __init__(self, url):
        self.sio = socketio.Client()
        self.url = url

    def connect(self, user_id):
        self.sio.connect(self.url, transports=['websocket', 'polling'])
        self.user_id = user_id
        self.sio.emit('join', {'userId': user_id})
        self.sio.on('response', self.handle_response)

    def handle_response(self, data):
        if data['success']:
            print("Request succeeded")
        else:
            print("Request failed")

    def send_message(self, message):
        self.sio.emit('message', {'message': message, 'userId': self.user_id}, namespace='/')

    def send_request(self):
        self.sio.emit('request')

    def close(self):
        self.sio.disconnect()

class UserBehavior(TaskSet):

    def load_messages(self):
        with open('messages.json', 'r', encoding='utf-8') as file:
            self.messages = json.load(file)

    def generate_message(self):
        return random.choice(self.messages)

    def on_start(self):
        self.load_messages()
        self.user_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        self.ws_client = SocketIOClient("http://localhost:3000")
        self.ws_client.connect(self.user_id)
        
        # index.html 가져오기
        self.client.get("/")

    @task(1)
    def send_message(self):
        message = self.generate_message()
        self.ws_client.send_message(message)

    @task(1)
    def send_request(self):
        self.ws_client.send_request()

    def on_stop(self):
        self.ws_client.close()

class WebsiteUser(HttpUser):
    tasks = [UserBehavior]
    wait_time = between(1, 3)
    host = "http://localhost:3000"
