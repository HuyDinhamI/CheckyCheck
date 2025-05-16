# Tech Context

## Công Nghệ Sử Dụng
-   **Backend:**
    *   **Ngôn ngữ lập trình:** Python
    *   **Web Framework:** Flask
    *   **Lõi Nhận Diện Cảm Xúc:** Dựa trên mã nguồn `main.py` (sử dụng PyTorch, OpenCV, MediaPipe).
    *   **Cơ sở dữ liệu (cho Bảng Xếp Hạng):** SQLite (đề xuất ban đầu, dễ tích hợp với Flask).
-   **Frontend:**
    *   **Ngôn ngữ lập trình:** TypeScript
    *   **Thư viện/Framework (tùy chọn):** Có thể không cần framework lớn ban đầu, tập trung vào TypeScript thuần và các thư viện nhỏ nếu cần.
    *   **Styling:** CSS (với trọng tâm vào animations).
    *   **HTML**
-   **Công cụ phát triển khác:**
    *   **Quản lý phiên bản:** Git
    *   **Trình biên dịch TypeScript:** `tsc` hoặc bundler (Webpack/Parcel - sẽ quyết định sau nếu cần).
    *   **Môi trường ảo Python:** `venv` hoặc `conda`.

## Thiết Lập Môi Trường Phát Triển
-   **Backend:**
    1.  Cài đặt Python.
    2.  Tạo môi trường ảo và cài đặt các thư viện: `Flask`, `torch`, `torchvision`, `opencv-python`, `mediapipe`, `numpy`, `Pillow`.
    3.  Đặt các tệp model (`.pt`) vào vị trí thích hợp để backend có thể tải.
-   **Frontend:**
    1.  Cài đặt Node.js và npm/yarn.
    2.  Cài đặt TypeScript (`npm install -g typescript` hoặc local cho dự án).
    3.  Thiết lập tệp `tsconfig.json` để cấu hình trình biên dịch TypeScript.
    4.  Thiết lập quy trình build để biên dịch TypeScript sang JavaScript (ví dụ: một script trong `package.json` để chạy `tsc`).

## Ràng Buộc Kỹ Thuật
-   **Hiệu suất nhận diện:** Phản hồi từ backend về cảm xúc nhận diện cần đủ nhanh để không làm gián đoạn trải nghiệm chơi game.
-   **Truy cập Camera:** Cần xử lý quyền truy cập camera một cách mượt mà và thông báo rõ ràng cho người dùng.
-   **Tương thích trình duyệt:** Đảm bảo các API JavaScript để truy cập camera và các tính năng frontend hoạt động trên các trình duyệt hiện đại phổ biến.
-   **Bảo mật:** Nếu có thông tin người dùng (ví dụ: tên cho bảng xếp hạng), cần cân nhắc các vấn đề bảo mật cơ bản.

## Phụ Thuộc (Dependencies)
-   **Backend:**
    *   Flask
    *   PyTorch
    *   OpenCV
    *   MediaPipe
    *   NumPy
    *   Pillow
-   **Frontend:**
    *   TypeScript (là dev dependency)
    *   (Có thể có các thư viện nhỏ khác cho UI hoặc gọi API nếu cần)

## Cấu Trúc Thư Mục Đề Xuất (Ban đầu)
```
/CheekyCheck
|-- /memory-bank
|   |-- projectbrief.md
|   |-- productContext.md
|   |-- techContext.md
|   |-- systemPatterns.md
|   |-- activeContext.md
|   |-- progress.md
|-- /backend
|   |-- app.py             # Flask application
|   |-- emotion_detector.py # Lõi xử lý cảm xúc (từ main.py đã điều chỉnh)
|   |-- models/            # Nơi chứa các file .pt
|   |-- database.db        # SQLite database file (nếu dùng)
|   |-- requirements.txt
|-- /frontend
|   |-- /src               # Mã nguồn TypeScript
|   |   |-- main.ts
|   |   |-- ui.ts
|   |   |-- gameLogics.ts
|   |   |-- apiService.ts
|   |-- /public            # Chứa HTML, CSS, và JS đã biên dịch
|   |   |-- index.html
|   |   |-- style.css
|   |   |-- /js            # Nơi chứa JS sau khi biên dịch từ TS
|   |-- tsconfig.json
|   |-- package.json
|-- main.py                # File gốc, có thể giữ lại để tham khảo
|-- README.md
|-- .clinerules            # (Sẽ tạo sau nếu cần)
