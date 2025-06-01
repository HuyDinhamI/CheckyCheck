# 🎭 CheckyCheck - Emotion Challenge Game

Một game web thú vị để thử thách khả năng thể hiện cảm xúc của bạn! Sử dụng AI để nhận diện cảm xúc qua camera và vượt qua 3 màn chơi.

## 🎯 Tính năng

- **Real-time emotion detection**: Nhận diện cảm xúc qua camera
- **3 levels game**: Vượt qua 3 màn với cảm xúc ngẫu nhiên
- **7 emotions**: Happy, Sad, Angry, Surprised, Fearful, Disgusted, Neutral
- **Threshold scoring**: Cần đạt 70% độ chính xác để pass
- **Beautiful UI**: Giao diện đẹp, responsive
- **Real-time feedback**: Hiển thị điểm số trực tiếp

## 🛠️ Setup

### 1. Dependencies

Cài đặt Python dependencies:

```bash
# Tạo virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc: venv\Scripts\activate  # Windows

# Cài đặt packages
pip install -r requirements.txt
```

### 2. Model Setup

Đảm bảo có file `model.h5` trong thư mục `../src/`:

```
CheckyCheck/
├── server.py
├── requirements.txt
└── ../src/
    ├── model.h5                    # Model đã train
    └── haarcascade_frontalface_default.xml
```

### 3. Chạy Server

```bash
# Trong thư mục CheckyCheck
python server.py
```

Server sẽ chạy tại: `http://localhost:5000`

## 🎮 Cách chơi

1. **Mở browser** và truy cập `http://localhost:5000`
2. **Cho phép camera access** khi được yêu cầu
3. **Nhấn "Bắt đầu chơi"**
4. **Thể hiện cảm xúc** được yêu cầu trước camera
5. **Giữ cảm xúc 2-3 giây** để đạt 70% pass màn
6. **Hoàn thành 3 màn** để thắng game!

## 🏗️ Kiến trúc

```
Frontend (HTML/CSS/JS)
    ↓
Camera API (getUserMedia)
    ↓
Base64 Image Data
    ↓
Flask Backend Server
    ↓
TensorFlow Model (model.h5)
    ↓
Emotion Prediction
    ↓
JSON Response
    ↓
Game Logic & UI Update
```

## 📁 Cấu trúc project

```
CheckyCheck/
├── index.html              # Main HTML file
├── server.py               # Flask backend server
├── requirements.txt        # Python dependencies
├── README.md              # This file
└── assets/
    ├── css/
    │   └── style.css       # Styles
    └── js/
        ├── main.js         # App controller
        ├── camera.js       # Camera handling
        └── game.js         # Game logic
```

## 🔧 API Endpoints

### `GET /`
Serve trang chủ

### `POST /predict`
Predict emotion từ image

**Request:**
```json
{
    "image": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Response:**
```json
{
    "faces_detected": 1,
    "emotions": [{
        "face_position": {"x": 100, "y": 50, "w": 200, "h": 250},
        "max_emotion": "happy",
        "max_confidence": 0.85,
        "all_emotions": {
            "angry": 0.02,
            "disgusted": 0.01,
            "fearful": 0.03,
            "happy": 0.85,
            "neutral": 0.05,
            "sad": 0.02,
            "surprised": 0.02
        }
    }],
    "message": "Success"
}
```

### `GET /health`
Health check endpoint

## 🎨 Customization

### Thay đổi độ khó
Trong `assets/js/game.js`:

```javascript
this.threshold = 70;        // Threshold để pass (70%)
this.requiredFrames = 60;   // Số frames cần giữ (2s)
```

### Thêm emotions mới
1. Update `emotion_dict` trong `server.py`
2. Update `utils.emotionNames` và `utils.emotionIcons` trong `main.js`

### Thay đổi số màn
Trong `game.js`:

```javascript
this.levels = utils.getRandomEmotions(3); // 3 → số màn bạn muốn
```

## 🐛 Troubleshooting

### Camera không hoạt động
- Kiểm tra browser có hỗ trợ getUserMedia API
- Đảm bảo đã cho phép camera access
- Thử refresh page và allow lại camera

### Server không start được
- Kiểm tra đã cài đầy đủ dependencies
- Đảm bảo file `../src/model.h5` tồn tại
- Kiểm tra port 5000 có bị occupied không

### Model predict lỗi
- Kiểm tra model.h5 có đúng format không
- Đảm bảo TensorFlow version compatible
- Check server logs trong terminal

### Face detection không hoạt động
- Đảm bảo đủ ánh sáng
- Nhìn thẳng vào camera
- Giữ khuôn mặt trong frame

## 📝 TODO

- [ ] Add sound effects
- [ ] Leaderboard system
- [ ] Multiple difficulty levels
- [ ] Mobile optimization
- [ ] Multiplayer mode
- [ ] Custom emotion sequences

## 🤝 Contributing

Feel free to contribute! Open issues hoặc tạo pull requests.

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết.

---

**Enjoy playing CheckyCheck! 🎭✨**
