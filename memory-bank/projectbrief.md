# CheckyCheck - Emotion Challenge Game

## 🎯 Tổng quan dự án

CheckyCheck là một game web thú vị sử dụng AI để nhận diện cảm xúc qua camera. Người chơi cần thể hiện cảm xúc được yêu cầu để vượt qua 3 màn chơi.

## 🎮 Mục tiêu chính

- **Real-time emotion detection**: Nhận diện cảm xúc qua camera với AI
- **3 levels gameplay**: Vượt qua 3 màn với cảm xúc ngẫu nhiên
- **7 emotions support**: Happy, Sad, Angry, Surprised, Fearful, Disgusted, Neutral
- **Threshold scoring**: Cần đạt 60% độ chính xác để pass
- **Beautiful UI**: Giao diện đẹp, responsive

## 🏗️ Kiến trúc hệ thống

```
Frontend (HTML/CSS/JS) → Camera API → Base64 Image → Flask Backend → TensorFlow Model → JSON Response → Game Logic
```

## 📁 Cấu trúc project

```
CheckyCheck/
├── index.html              # Main HTML file
├── server.py               # Flask backend server
├── requirements.txt        # Python dependencies
├── README.md              # Documentation
├── memory-bank/           # Memory bank documentation
└── assets/
    ├── css/
    │   └── style.css       # Styles
    └── js/
        ├── main.js         # App controller
        ├── camera.js       # Camera handling
        └── game.js         # Game logic
```

## 🎯 Yêu cầu game

- **Độ chính xác**: 60% để pass màn
- **Thời gian giữ cảm xúc**: Màn 1 (2s), Màn 2 (3s), Màn 3 (4s)
- **Camera**: Cần webcam để chơi
- **Server**: Flask backend với TensorFlow model

## 🔧 API Endpoints

- `GET /`: Serve trang chủ
- `POST /predict`: Predict emotion từ image
- `GET /health`: Health check

## 🚀 Cách chạy

1. Cài đặt dependencies: `pip install -r requirements.txt`
2. Chạy server: `python server.py`
3. Truy cập: `http://localhost:5000`
