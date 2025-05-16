# Active Context

## Trọng Tâm Công Việc Hiện Tại
-   **Giai đoạn 1: Nền tảng Backend và Lõi Nhận Diện.**
    -   Thiết lập dự án Flask cho backend.
    -   Tái cấu trúc `main.py` thành một module `emotion_detector.py` có thể gọi được, nhận frame ảnh làm đầu vào và trả về kết quả nhận diện.
    -   Xây dựng các API endpoint cơ bản: `/process_frame` (ban đầu chỉ để kiểm tra việc nhận diện), `/start_game_round` (trả về thông tin giả lập), `/leaderboard` (trả về dữ liệu giả lập), `/submit_score` (log ra console).
    -   Thiết lập cơ sở dữ liệu SQLite và schema cho bảng xếp hạng.

## Các Thay Đổi Gần Đây
-   Đã cập nhật các tệp Memory Bank (`projectbrief.md`, `productContext.md`, `techContext.md`, `systemPatterns.md`) để phản ánh kế hoạch xây dựng web game nhận diện cảm xúc với nhiều chế độ chơi và bảng xếp hạng.

## Các Bước Tiếp Theo
1.  **Tạo cấu trúc thư mục dự án** theo đề xuất trong `techContext.md` (thư mục `/backend`, `/frontend`).
2.  **Backend - Thiết lập Flask:**
    *   Tạo tệp `backend/app.py`.
    *   Tạo tệp `backend/requirements.txt` với các thư viện cần thiết (Flask, etc.).
    *   Cài đặt các thư viện này vào một môi trường ảo.
3.  **Backend - Tái cấu trúc Lõi Nhận Diện:**
    *   Tạo tệp `backend/emotion_detector.py`.
    *   Di chuyển và điều chỉnh code từ `main.py` vào `emotion_detector.py` để tạo một hàm/class có thể nhận frame ảnh (dưới dạng mảng NumPy hoặc đối tượng ảnh PIL) và trả về cảm xúc + độ tin cậy.
    *   Đảm bảo các tệp model (`.pt`) được đặt đúng chỗ (ví dụ: `backend/models/`) và `emotion_detector.py` có thể tải chúng.
4.  **Backend - API Endpoints ban đầu:**
    *   Triển khai API `/process_frame` trong `app.py` để nhận một frame ảnh (có thể là base64 encoded string ban đầu để test), gọi `emotion_detector.py`, và trả về kết quả JSON.
5.  **Frontend - Thiết lập cơ bản:**
    *   Tạo thư mục `frontend/src` và `frontend/public`.
    *   Tạo `frontend/public/index.html` cơ bản.
    *   Tạo `frontend/src/main.ts` cơ bản.
    *   Thiết lập `frontend/tsconfig.json` và `frontend/package.json` (với script để build TypeScript).
6.  **Frontend - Kết nối API Test:**
    *   Trong `main.ts`, viết code để chụp ảnh từ camera (sử dụng `getUserMedia`), gửi đến API `/process_frame` của backend (sử dụng `fetch`), và hiển thị kết quả nhận được. Đây là bước để kiểm tra sự thông suốt giữa frontend và backend.

## Các Quyết Định và Cân Nhắc Hiện Tại
-   **Cách gửi frame ảnh từ Frontend sang Backend:**
    *   **Base64 encoded string:** Đơn giản để triển khai ban đầu cho việc test.
    *   **FormData (Blob/File):** Hiệu quả hơn cho dữ liệu nhị phân, nên xem xét cho phiên bản hoàn thiện.
    *   **WebSockets:** Có thể cân nhắc sau này nếu cần tương tác real-time mượt mà hơn và giảm overhead của HTTP request cho mỗi frame, nhưng phức tạp hơn để triển khai ban đầu.
    *   *Quyết định ban đầu:* Sử dụng Base64 cho việc test API `/process_frame` đầu tiên.
-   **Tần suất gửi frame:** Cần cân bằng giữa độ mượt của game và tải cho backend. Có thể bắt đầu với việc gửi frame mỗi 0.5 - 1 giây, sau đó điều chỉnh.
-   **Bundler cho Frontend:** Hiện tại sẽ dùng `tsc` trực tiếp. Nếu dự án frontend phức tạp hơn, có thể cân nhắc Webpack hoặc Parcel sau.
