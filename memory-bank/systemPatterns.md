# System Patterns

## Kiến Trúc Hệ Thống Tổng Quan
Hệ thống sẽ được xây dựng theo kiến trúc Client-Server:
-   **Client (Frontend):** Là một ứng dụng web chạy trên trình duyệt của người dùng, được xây dựng bằng HTML, CSS (với animations), và TypeScript. Frontend chịu trách nhiệm hiển thị giao diện người dùng, thu nhận hình ảnh từ camera, gửi yêu cầu đến backend, và hiển thị kết quả/trạng thái game.
-   **Server (Backend):** Là một ứng dụng Flask (Python) chạy trên máy chủ. Backend chịu trách nhiệm xử lý logic game, giao tiếp với lõi nhận diện cảm xúc, quản lý điểm số và bảng xếp hạng.

```mermaid
graph TD
    A[Người dùng (Trình duyệt)] -- Tương tác UI --> B(Frontend - TypeScript, HTML, CSS);
    B -- Gửi Frame Ảnh & Yêu Cầu Game --> C(Backend - Flask API);
    C -- Gọi Xử Lý --> D(Lõi Nhận Diện Cảm Xúc - Python, PyTorch, MediaPipe);
    D -- Trả Kết Quả Nhận Diện --> C;
    C -- Truy Vấn/Cập Nhật --> E(Cơ sở dữ liệu - SQLite);
    C -- Trả Kết Quả Game & Dữ Liệu BXH --> B;
    B -- Cập Nhật UI & Hiển Thị --> A;
```

## Các Quyết Định Kỹ Thuật Quan Trọng
-   **Tách biệt Frontend và Backend:** Giúp phát triển độc lập và dễ quản lý.
-   **Sử dụng Flask cho Backend:** Nhẹ, linh hoạt, phù hợp cho việc xây dựng API và tích hợp với các thư viện Python hiện có (lõi nhận diện cảm xúc).
-   **Sử dụng TypeScript cho Frontend:** Tăng cường tính chặt chẽ của mã nguồn, dễ bảo trì và mở rộng.
-   **Giao tiếp qua API RESTful:** Frontend và Backend sẽ giao tiếp thông qua các HTTP request/response (JSON).
-   **Lưu trữ Bảng Xếp Hạng bằng SQLite:** Đơn giản, dễ cài đặt và phù hợp cho quy mô dự án ban đầu.
-   **Lõi nhận diện cảm xúc được module hóa:** Phần code từ `main.py` sẽ được tái cấu trúc thành một module/hàm riêng biệt để backend dễ dàng gọi và sử dụng.

## Mẫu Thiết Kế (Design Patterns) Sử Dụng (Dự kiến)
-   **Backend (Flask):**
    *   **Model-View-Controller (MVC) hoặc Model-View-Template (MVT) ở mức độ cơ bản:** Flask khuyến khích việc tách biệt logic, dữ liệu và trình bày.
    *   **Repository Pattern (có thể):** Nếu logic truy cập cơ sở dữ liệu cho bảng xếp hạng trở nên phức tạp, có thể áp dụng để tách biệt logic nghiệp vụ khỏi chi tiết truy cập dữ liệu.
-   **Frontend (TypeScript):**
    *   **Module Pattern:** Chia mã nguồn thành các module nhỏ, dễ quản lý (ví dụ: `ui.ts`, `gameLogics.ts`, `apiService.ts`).
    *   **Observer Pattern (có thể):** Để quản lý trạng thái game và cập nhật UI khi có thay đổi.
    *   **Service Pattern (ApiService):** Tách biệt logic gọi API ra khỏi các thành phần UI.

## Mối Quan Hệ Giữa Các Thành Phần (Components)

1.  **Frontend UI Component (`ui.ts`, HTML, CSS):**
    *   Hiển thị các màn hình game (menu, chơi game, bảng xếp hạng).
    *   Thu nhận sự kiện từ người dùng (chọn chế độ chơi, nhập tên).
    *   Hiển thị video từ camera.
    *   Gửi yêu cầu đến `GameLogic Component`.
    *   Cập nhật giao diện dựa trên dữ liệu từ `GameLogic Component`.

2.  **Frontend GameLogic Component (`gameLogics.ts`):**
    *   Quản lý trạng thái hiện tại của game (chế độ chơi, vòng chơi, điểm số, thời gian).
    *   Điều phối luồng chơi game.
    *   Chụp frame từ camera.
    *   Gọi `ApiService` để gửi frame và yêu cầu xử lý đến backend.
    *   Nhận kết quả từ `ApiService` và cập nhật trạng thái game, thông báo cho `UI Component`.

3.  **Frontend ApiService Component (`apiService.ts`):**
    *   Chịu trách nhiệm gửi HTTP request đến các API endpoint của Backend.
    *   Xử lý response từ Backend và trả về dữ liệu đã được định dạng cho `GameLogic Component`.

4.  **Backend API Endpoints (Flask - `app.py`):**
    *   Tiếp nhận các HTTP request từ Frontend.
    *   Xác thực và phân tích cú pháp request.
    *   Gọi các module xử lý logic nghiệp vụ tương ứng (ví dụ: `EmotionDetectorService`, `LeaderboardService`).
    *   Trả về HTTP response (thường là JSON) cho Frontend.

5.  **Backend EmotionDetectorService (`emotion_detector.py`):**
    *   Chứa logic nhận diện cảm xúc đã được điều chỉnh từ `main.py`.
    *   Nhận frame ảnh và các tham số cần thiết (ví dụ: cảm xúc mục tiêu) từ API Endpoint.
    *   Thực hiện tiền xử lý ảnh, gọi mô hình PyTorch để dự đoán.
    *   Trả về kết quả nhận diện (cảm xúc, độ tin cậy).

6.  **Backend LeaderboardService (trong `app.py` hoặc module riêng):**
    *   Chứa logic tương tác với cơ sở dữ liệu SQLite.
    *   Xử lý việc lưu điểm số mới.
    *   Truy vấn và trả về danh sách top người chơi.

7.  **Database (SQLite - `database.db`):**
    *   Lưu trữ bảng dữ liệu cho bảng xếp hạng (ví dụ: `id`, `player_name`, `score`, `game_mode`, `timestamp`).

## Luồng Dữ Liệu Chính (Ví dụ: một lượt chơi)
1.  Người dùng chọn chế độ chơi trên Frontend.
2.  Frontend (`gameLogics.ts`) gọi API `/start_game_round` của Backend.
3.  Backend (`app.py`) xác định thông tin cho vòng chơi (ví dụ: cảm xúc mục tiêu) và trả về cho Frontend.
4.  Frontend hiển thị thông tin vòng chơi, kích hoạt camera.
5.  Định kỳ (hoặc khi người dùng ra hiệu), Frontend (`gameLogics.ts`) chụp một frame ảnh.
6.  Frontend (`apiService.ts`) gửi frame ảnh và thông tin trạng thái game hiện tại đến API `/process_frame` của Backend.
7.  Backend (`app.py`) nhận frame, gọi `EmotionDetectorService` (`emotion_detector.py`) để xử lý.
8.  `EmotionDetectorService` trả về cảm xúc nhận diện và độ tin cậy.
9.  Backend (`app.py`) áp dụng logic của chế độ chơi hiện tại (kiểm tra ngưỡng, thời gian, v.v.), tính điểm.
10. Backend trả kết quả (thành công/thất bại, điểm mới, cảm xúc nhận diện) cho Frontend.
11. Frontend (`gameLogics.ts` cập nhật trạng thái, `ui.ts` cập nhật giao diện).
12. Lặp lại từ bước 5 cho đến khi kết thúc game.
13. Nếu kết thúc game, Frontend cho phép nhập tên (nếu điểm cao) và gọi API `/submit_score`.
14. Backend lưu điểm vào SQLite.
15. Người dùng có thể xem bảng xếp hạng bằng cách Frontend gọi API `/leaderboard`.
