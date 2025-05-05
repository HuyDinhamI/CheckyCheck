# Emotion Game - Trò Chơi Nhận Diện Cảm Xúc

Một trò chơi tương tác thú vị dựa trên công nghệ nhận diện cảm xúc khuôn mặt. Người chơi sẽ phải biểu cảm khuôn mặt theo yêu cầu để vượt qua các màn chơi với độ chính xác cao.

## Tổng Quan

Game có cơ chế đơn giản nhưng thú vị:
- Mỗi màn chơi yêu cầu người chơi thể hiện một cảm xúc cụ thể (vui vẻ, buồn bã, ngạc nhiên...)
- Hệ thống AI sẽ phân tích khuôn mặt người chơi theo thời gian thực
- Khi biểu cảm đạt trên 90% độ chính xác trong 2 giây, người chơi sẽ vượt qua màn chơi
- Hoàn thành tất cả các màn chơi trong thời gian giới hạn để chiến thắng

## Cấu Trúc Dự Án

```
emotion_reg/
├── index.html             # File HTML chính
├── README.md              # File hướng dẫn
├── styles/
│   └── main.css           # CSS cho giao diện
├── scripts/
│   ├── main.js            # JavaScript chính
│   ├── game.js            # Logic game
│   ├── emotionDetector.js # Module nhận diện cảm xúc
│   └── ui.js              # Quản lý giao diện người dùng
├── models/
│   └── emotion_model/     # Thư mục chứa model nhận diện (nếu có)
└── assets/
    ├── images/            # Thư mục chứa hình ảnh
    └── sounds/            # Thư mục chứa âm thanh
```

## Cách Chạy Dự Án

### Phương pháp 1: Chạy Locally

1. **Sử dụng Live Server**:
   - Cài đặt extension Live Server trong VS Code
   - Chuột phải vào file `index.html` và chọn "Open with Live Server"

2. **Sử dụng HTTP server**:
   - Cài đặt Node.js
   - Cài đặt http-server: `npm install -g http-server`
   - Chạy lệnh: `http-server` trong thư mục dự án
   - Truy cập: `http://localhost:8080`

### Phương pháp 2: Sử dụng Docker

1. **Docker**:
   - Cài đặt [Docker](https://www.docker.com/get-started)
   - Chạy lệnh: `docker build -t emotion-game .` để tạo Docker image
   - Chạy lệnh: `docker run -p 8080:80 emotion-game`
   - Truy cập: `http://localhost:8080`

2. **Docker Compose**:
   - Cài đặt [Docker Compose](https://docs.docker.com/compose/install/)
   - Chạy lệnh: `docker-compose up`
   - Truy cập: `http://localhost:8080`

**Lưu ý quan trọng**: Dự án cần được chạy trên một HTTP server để hoạt động chính xác, không thể mở trực tiếp file HTML vì các hạn chế của trình duyệt khi truy cập camera và API trên giao thức `file://`.

## Tính Năng Chính

- **Nhận diện 7 cảm xúc cơ bản**: Vui vẻ, buồn bã, giận dữ, sợ hãi, ngạc nhiên, ghê tởm, bình thường
- **Phân tích khuôn mặt theo thời gian thực** với độ chính xác cao
- **Giao diện thân thiện** và trực quan
- **Hỗ trợ 2 chế độ nhận diện**: 
  - Sử dụng Face-api.js (mặc định)
  - Sử dụng model tùy chỉnh (nếu có)

## Tích Hợp Model Tùy Chỉnh

Bạn có thể tích hợp model nhận diện cảm xúc đã train sẵn:

1. Chuyển đổi model sang định dạng TensorFlow.js:
   ```bash
   # Nếu model là TensorFlow/Keras
   pip install tensorflowjs
   tensorflowjs_converter --input_format=keras /đường/dẫn/model.h5 ./models/emotion_model/
   ```

2. Đặt các file model đã chuyển đổi vào thư mục `models/emotion_model/`:
   - `model.json` (cấu trúc model)
   - `*.bin` (các file trọng số)

3. Hệ thống sẽ tự động phát hiện và sử dụng model tùy chỉnh của bạn. Nếu không tìm thấy, hệ thống sẽ sử dụng Face-api.js làm phương án dự phòng.

## Yêu Cầu Hệ Thống

- **Trình duyệt hiện đại**: Chrome (khuyên dùng), Firefox, Edge
- **Camera**: Webcam hoạt động tốt
- **Kết nối internet**: Để tải các thư viện cần thiết
- **Ánh sáng đầy đủ**: Để nhận diện khuôn mặt chính xác

## Debug và Kiểm Tra

Mở console của trình duyệt và sử dụng các công cụ debug:

```javascript
// Kiểm tra trạng thái game
debugGame.logGameState();

// Chuyển đến màn chơi cụ thể
debugGame.skipToLevel(3);

// Kiểm tra nhận diện cảm xúc
debugGame.testEmotionDetection();
```

## Các Vấn Đề Thường Gặp

1. **Không thể truy cập camera**:
   - Đảm bảo đã cấp quyền truy cập camera cho trang web
   - Kiểm tra xem camera có đang được sử dụng bởi ứng dụng khác không

2. **Nhận diện không chính xác**:
   - Đảm bảo ánh sáng đầy đủ
   - Giữ khuôn mặt trong khung hình
   - Thử biểu cảm rõ ràng hơn

3. **Hiệu suất chậm**:
   - Đảm bảo máy tính đủ mạnh
   - Đóng các ứng dụng nặng khác
   - Sử dụng trình duyệt Chrome để có hiệu suất tốt nhất

## Mở Rộng & Tùy Chỉnh

Dự án được thiết kế để dễ dàng mở rộng:

- Thêm màn chơi mới trong file `game.js`
- Thay đổi giao diện trong `main.css`
- Điều chỉnh độ khó trong `game.js` (thay đổi `minDetectionThreshold`)
- Thêm âm thanh và hiệu ứng cho trải nghiệm tốt hơn

## Giấy Phép

Dự án này được phát triển dưới dạng hobby project và có thể được sử dụng miễn phí cho mục đích phi thương mại.

## Tác Giả

- Dựa trên ý tưởng ban đầu về game nhận diện cảm xúc

## Công Nghệ Sử Dụng

- **TensorFlow.js**: Framework ML cho JavaScript
- **Face-api.js**: Thư viện nhận diện khuôn mặt
- **HTML5/CSS3/JavaScript**: Xây dựng giao diện web
- **Canvas API**: Vẽ và hiển thị khuôn mặt

---

Chúc bạn có những trải nghiệm thú vị với Emotion Game! 😊
