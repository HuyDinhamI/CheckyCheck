# 🎮 Web Pose Match Game

Game nhận diện tư thế sử dụng AI với MediaPipe. Người chơi bắt chước các tư thế mẫu và nhận điểm dựa trên độ chính xác.

## ✨ Tính năng

- **3 Phase Game**: Đăng nhập (tên + Gmail) → Chơi game → Kết thúc
- **5 Rounds**: Mỗi round 8 giây với tư thế ngẫu nhiên
- **Real-time Pose Detection**: MediaPipe Web
- **Scoring**: 10-7-3 điểm dựa trên độ chính xác pose
- **Leaderboard**: Lưu điểm trong localStorage
- **Rich Animations**: CSS animations với glassmorphism design

## 📁 Cấu trúc project

```
web-pose-game/
├── index.html              # Game chính
├── styles.css              # CSS + animations  
├── game.js                 # Game logic
├── pose-processor.js       # MediaPipe utilities
├── batch_pose_extractor.py # Tool tạo pose data
├── start_bg.jpg           # Background image
└── poses/
    ├── images/            # Ảnh pose (input)
    └── processed/         # JSON data (output)
```

## 🚀 Cách sử dụng

### 1. Setup Game
```bash
# Clone project
git clone <repo>
cd web-pose-game

# Chạy web server (cần cho camera access)
python -m http.server 8000

# Mở browser: http://localhost:8000
```

### 2. Thêm Pose Mới
```bash
# 1. Copy ảnh pose vào thư mục
cp your_poses/*.jpg poses/images/

# 2. Chạy script tự động tạo JSON
python batch_pose_extractor.py

# 3. Game tự động sử dụng poses mới!
```

### 3. Chơi Game
1. Mở `http://localhost:8000`
2. Nhập tên + Gmail
3. Cho phép camera access  
4. Bắt chước tư thế hiển thị
5. Xem điểm và leaderboard

## 🔧 Technical Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **AI**: MediaPipe Web (pose detection)
- **Camera**: WebRTC getUserMedia
- **Storage**: LocalStorage (scores)
- **Processing**: Python (MediaPipe for batch processing)

## 🎯 Pose Detection

Game so sánh **11 góc quan trọng**:
- Gập tay trái/phải (khuỷu tay)
- Nâng tay trái/phải (vai)  
- Gập gối trái/phải
- Thẳng chân trái/phải
- Góc đầu, lưng trái/phải

## ⚙️ Customization

### Thay đổi game settings:
```javascript
// Trong game.js
this.NUM_ROUNDS = 5;        // Số rounds
this.TIME_PER_ROUND = 8;    // Giây mỗi round
```

### Thay đổi scoring:
```javascript  
// Trong pose-processor.js
getPoints(angleDifference) {
    if (angleDifference < 10) return 10;
    if (angleDifference < 20) return 7;
    return 3;
}
```

## 🐛 Troubleshooting

### Camera không hoạt động
- Chạy qua `http://localhost` (không dùng `file://`)
- Cho phép camera permission
- Thử Chrome/Firefox

### Pose detection không chính xác  
- Đảm bảo lighting tốt
- Đứng trọn trong khung hình
- Background đơn giản

### Thêm pose bị lỗi
- Kiểm tra ảnh có người rõ ràng
- Chạy `python batch_pose_extractor.py` với ảnh chất lượng tốt
- Xem log để debug

## 📝 Yêu cầu ảnh pose

### ✅ Ảnh tốt:
- Người đứng rõ ràng trong khung
- Lighting đều, không bị mờ
- Background đơn giản
- Tư thế distinctive
- Format: JPG, PNG

### ❌ Tránh:
- Ảnh mờ, tối
- Người bị che khuất  
- Background phức tạp
- Tư thế khó nhận diện

## 🎮 Demo Workflow

```bash
# Ví dụ: Thêm 3 pose yoga
cp yoga_poses/*.jpg poses/images/
python batch_pose_extractor.py
# Input: y (xác nhận xử lý)

# Kết quả:
✅ Thành công: 3 poses
📊 Cập nhật index.json: 8 poses tổng cộng  
🎮 Game đã sẵn sàng với 3 poses mới!

# Test game
open http://localhost:8000
```

## 📄 License

MIT License - Sử dụng và chỉnh sửa tự do!

---

**Enjoy the game! 🎮✨**

Made with ❤️ using MediaPipe + Web Technologies
