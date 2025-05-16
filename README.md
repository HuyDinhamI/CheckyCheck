# Trò Chơi Nhận Diện Cảm Xúc

Ứng dụng web game sử dụng trí tuệ nhân tạo để nhận diện cảm xúc của người chơi thông qua camera.

## Cấu Trúc Dự Án

```
/
├── backend/               # Server và API endpoints
│   ├── app.py            # Flask application
│   ├── emotion_detector.py # Module nhận diện cảm xúc
│   ├── requirements.txt  # Python dependencies
│   └── models/           # Các model AI đã được huấn luyện
│       ├── FER_static_ResNet50_AffectNet.pt
│       └── FER_dinamic_LSTM_Aff-Wild2.pt
│
└── frontend/             # Web interface
    ├── src/              # TypeScript source code
    │   ├── main.ts      # Entry point
    │   ├── ui.ts        # UI management
    │   ├── apiService.ts # API communication
    │   └── gameLogics.ts # Game logic
    ├── public/           # Static assets
    │   ├── index.html   # Main HTML
    │   ├── css/         # Stylesheets
    │   └── js/          # Compiled JavaScript
    ├── package.json     # Node.js dependencies
    └── tsconfig.json    # TypeScript configuration
```

## Các Tính Năng

- Nhận diện cảm xúc thời gian thực qua camera
- Nhiều chế độ chơi:
  - **Cơ Bản**: Thể hiện 3 cảm xúc cụ thể theo yêu cầu
  - **Thử Thách Thời Gian**: Thể hiện các cảm xúc với thời gian giới hạn giảm dần
  - **Bậc Thầy Cảm Xúc**: Thể hiện một chuỗi cảm xúc theo thứ tự
  - **Thử Thách Cường Độ**: Duy trì cường độ cảm xúc trong khoảng mục tiêu
- Bảng xếp hạng để theo dõi điểm số

## Cài Đặt và Chạy

### Backend

1. Tạo và kích hoạt môi trường ảo Python:
   ```
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   ```

2. Cài đặt các thư viện cần thiết:
   ```
   cd backend
   pip install -r requirements.txt
   ```

3. Chạy server:
   ```
   python app.py
   ```

   Backend sẽ chạy tại địa chỉ http://localhost:5000

### Frontend

1. Cài đặt Node.js và npm (nếu chưa có)

2. Cài đặt các dependencies:
   ```
   cd frontend
   npm install
   ```

3. Biên dịch TypeScript:
   ```
   npm run build
   ```

4. Mở file `frontend/public/index.html` trong trình duyệt web hoặc phục vụ bằng một web server đơn giản:
   ```
   # Sử dụng Python
   cd frontend/public
   python -m http.server 8000
   ```
   
   Sau đó truy cập http://localhost:8000 trong trình duyệt của bạn.

### Yêu Cầu Hệ Thống

- Camera web
- Trình duyệt hiện đại hỗ trợ WebRTC (Chrome, Firefox, Edge, Safari)
- Python 3.7+
- Node.js 14+

## Phát Triển

Để phát triển frontend:
```
cd frontend
npm run watch
```

Điều này sẽ biên dịch TypeScript khi có thay đổi.

## Công Nghệ Sử Dụng

- **Backend**: Python, Flask, PyTorch, MediaPipe
- **Frontend**: TypeScript, HTML5, CSS3
- **Mô hình AI**: ResNet50, LSTM

## Giấy Phép

[MIT License](LICENSE)
