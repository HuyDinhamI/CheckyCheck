# 🎵 Game Puzzle Bài Xẩm với Hand Tracking

Game puzzle âm nhạc tương tác sử dụng hand tracking để sắp xếp các đoạn bài hát xẩm truyền thống Việt Nam theo đúng thứ tự.

## 🎯 Tổng quan

Đây là một game giáo dục kết hợp công nghệ hiện đại (MediaPipe Hand Tracking) với văn hóa truyền thống Việt Nam (bài xẩm). Người chơi sử dụng cử chỉ tay để kéo thả các đoạn thơ, sau đó nghe nhạc để kiểm tra kết quả.

## ✨ Tính năng

### 🎮 Gameplay
- **Drag & Drop bằng tay**: Sử dụng cử chỉ chụm 5 ngón tay để cầm/thả
- **3 đoạn thơ**: Mỗi game có 3 đoạn của bài xẩm cần sắp xếp
- **Thứ tự ngẫu nhiên**: Các đoạn được trộn ngẫu nhiên mỗi lần chơi
- **Kiểm tra kết quả**: Phát nhạc theo thứ tự và hiển thị đúng/sai

### 🤖 Hand Tracking
- **MediaPipe Integration**: Sử dụng thư viện MediaPipe của Google
- **Pinch Gesture**: Chụm ngón tay cái và ngón tay trỏ để "cầm"
- **Hover Effects**: Visual feedback khi tay gần đối tượng
- **Real-time Detection**: Nhận diện tay thời gian thực

### 🎵 Audio System
- **Dynamic Audio Generation**: Tạo âm thanh động cho mỗi đoạn
- **Sequential Playback**: Phát nhạc tuần tự theo thứ tự sắp xếp
- **Visual Indicators**: Hiển thị đoạn nào đang phát
- **Web Audio API**: Sử dụng công nghệ audio tiên tiến

### 🎨 Giao diện
- **Responsive Design**: Tối ưu cho cả desktop và mobile
- **Modern UI**: Material Design với gradient và animations
- **Vietnamese Language**: Hoàn toàn tiếng Việt
- **Accessibility**: Dễ sử dụng cho mọi lứa tuổi

## 🛠️ Công nghệ sử dụng

- **HTML5**: Cấu trúc trang web
- **CSS3**: Styling với animations và responsive design
- **JavaScript ES6+**: Logic game và tương tác
- **MediaPipe**: Hand tracking và computer vision
- **Web Audio API**: Xử lý âm thanh
- **Canvas API**: Vẽ hand landmarks

## 📋 Yêu cầu hệ thống

### Trình duyệt hỗ trợ
- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Firefox 85+
- ✅ Safari 14+

### Phần cứng
- 📷 **Camera**: Webcam hoặc camera tích hợp
- 🎵 **Audio**: Loa hoặc tai nghe
- 💻 **RAM**: Tối thiểu 4GB
- 🌐 **Internet**: Kết nối ổn định (để tải MediaPipe)

## 🚀 Cách chạy

### Chạy local
```bash
# Clone hoặc download project
# Mở file index.html bằng trình duyệt hiện đại

# Hoặc chạy local server
python -m http.server 8000
# Truy cập http://localhost:8000
```

### Chạy online
- Upload các file lên web hosting
- Đảm bảo HTTPS (MediaPipe yêu cầu)
- Truy cập URL và cho phép camera

## 🎮 Hướng dẫn chơi

### Bước 1: Khởi động
1. Mở `index.html` trong trình duyệt
2. Cho phép truy cập camera khi được hỏi
3. Đợi hệ thống load MediaPipe

### Bước 2: Nhận diện tay
1. Đưa tay vào khung camera
2. Chờ hệ thống nhận diện (status chuyển thành "Tay được phát hiện")
3. Thấy các đường viền màu xanh lá trên tay

### Bước 3: Tương tác
1. **Hover**: Di chuyển tay gần đoạn thơ → đoạn thơ sáng lên
2. **Grab**: Chụm ngón tay cái và ngón tay trỏ → "cầm" đoạn thơ
3. **Drag**: Giữ cử chỉ chụm và di chuyển tay
4. **Drop**: Nhả cử chỉ chụm → "thả" đoạn thơ

### Bước 4: Sắp xếp
1. Kéo thả 3 đoạn thơ vào 3 vị trí (Vị trí 1, 2, 3)
2. Đọc nội dung và sắp xếp theo logic của bài hát
3. Nút "Kiểm tra & Phát nhạc" sẽ sáng khi đủ 3 đoạn

### Bước 5: Kiểm tra
1. Bấm "Kiểm tra & Phát nhạc"
2. Nghe nhạc phát theo thứ tự đã sắp xếp
3. Xem kết quả: "Chính xác" hoặc "Chưa đúng"
4. Bấm "Chơi lại" để thử lại

## 📁 Cấu trúc project

```
xam-puzzle-game/
├── index.html          # Giao diện chính
├── style.css           # Styling và animations
├── script.js           # Logic game và hand tracking
├── data.js             # Dữ liệu bài hát và audio
└── README.md           # Tài liệu này
```

### File chi tiết

#### `index.html`
- Cấu trúc HTML5 semantic
- Import MediaPipe CDN
- Video và canvas cho camera
- Game interface elements

#### `style.css`
- Responsive design với flexbox/grid
- CSS animations và transitions
- Modern color scheme
- Mobile-first approach

#### `script.js`
- `GameState`: Quản lý trạng thái game
- `HandTracker`: Xử lý MediaPipe và gestures
- `AudioManager`: Quản lý audio playback
- `GameController`: Điều khiển chính

#### `data.js`
- Dữ liệu bài xẩm mẫu
- Audio generation với Web Audio API
- Utility functions cho game logic

## 🎵 Bài hát mẫu

**"Tình Quê Hương - Bài Xẩm Truyền Thống"**

Gồm 3 đoạn thơ về tình yêu quê hương, gia đình và truyền thống Việt Nam:

1. **Đoạn 1**: Quê hương và thiên nhiên
2. **Đoạn 2**: Gia đình và tuổi thơ  
3. **Đoạn 3**: Lòng tri ân và gắn bó

## 🛠️ Tùy chỉnh

### Thêm bài hát mới
```javascript
// Trong data.js
const newSong = {
    title: "Tên bài hát",
    segments: [
        {
            id: 1,
            text: "Lời đoạn 1...",
            order: 1,
            audioFile: "audio1.mp3"
        },
        // ... thêm các đoạn khác
    ]
};
```

### Điều chỉnh hand tracking
```javascript
// Trong script.js - HandTracker class
this.hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,        // 0-1 (cao hơn = chính xác hơn)
    minDetectionConfidence: 0.7, // 0-1 (cao hơn = khó detect hơn)
    minTrackingConfidence: 0.5   // 0-1 (cao hơn = ổn định hơn)
});
```

### Thay đổi pinch sensitivity
```javascript
// Trong detectPinchGesture method
const pinchThreshold = 0.05; // Giảm = khó pinch hơn, tăng = dễ pinch hơn
```

## 🐛 Troubleshooting

### Camera không hoạt động
- ✅ Kiểm tra quyền truy cập camera
- ✅ Sử dụng HTTPS (không phải HTTP)
- ✅ Thử trình duyệt khác
- ✅ Kiểm tra camera có bị ứng dụng khác chiếm không

### Hand tracking không chính xác
- ✅ Đảm bảo ánh sáng đủ
- ✅ Giữ tay trong khung camera
- ✅ Không có vật cản che tay
- ✅ Thử điều chỉnh sensitivity

### Audio không phát
- ✅ Kiểm tra volume hệ thống
- ✅ Thử click vào trang web trước (autoplay policy)
- ✅ Kiểm tra trình duyệt hỗ trợ Web Audio API

### Performance kém
- ✅ Đóng các tab không cần thiết
- ✅ Kiểm tra CPU/RAM usage
- ✅ Thử giảm model complexity
- ✅ Giảm resolution camera

## 🔮 Tính năng tương lai

- [ ] **Nhiều bài hát**: Thêm thư viện bài xẩm
- [ ] **Multiplayer**: Chơi với bạn bè online
- [ ] **Scoring System**: Hệ thống điểm và leaderboard
- [ ] **Voice Recognition**: Nhận diện giọng nói hát theo
- [ ] **AR Effects**: Hiệu ứng thực tế ảo
- [ ] **Educational Mode**: Giải thích về bài xẩm

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy:

1. Fork project
2. Tạo feature branch
3. Commit changes
4. Push và tạo Pull Request

## 📄 License

MIT License - Tự do sử dụng cho mục đích học tập và thương mại.

## 👥 Credits

- **MediaPipe**: Google's hand tracking solution
- **Web Audio API**: Modern audio processing
- **Bài xẩm truyền thống**: Văn hóa dân gian Việt Nam
- **Modern Web Technologies**: HTML5, CSS3, ES6+

---

**Tạo bởi AI Assistant - Cline**  
*Kết hợp công nghệ hiện đại với truyền thống văn hóa Việt Nam* 🇻🇳

---

## 📞 Liên hệ & Hỗ trợ

Nếu gặp vấn đề hoặc có ý tưởng cải tiến, hãy tạo issue trong repository hoặc liên hệ trực tiếp.

**Chúc bạn chơi game vui vẻ!** 🎉
