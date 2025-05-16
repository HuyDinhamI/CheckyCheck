# Project Brief

## Tên Dự Án
Trò Chơi Web Nhận Diện Cảm Xúc (Emotion Recognition Web Game)

## Tóm Tắt Dự Án
Dự án này nhằm mục đích xây dựng một ứng dụng web tương tác dưới dạng trò chơi, nơi người dùng sử dụng camera để thể hiện các cảm xúc khuôn mặt theo yêu cầu. Hệ thống sẽ sử dụng mô hình học sâu (dựa trên `main.py` đã phân tích) để nhận diện cảm xúc. Trò chơi sẽ bao gồm nhiều chế độ chơi khác nhau và một bảng xếp hạng để tăng tính cạnh tranh và hấp dẫn.

## Mục Tiêu Cốt Lõi
1.  Xây dựng một trang web game nhận diện cảm xúc hoạt động ổn định.
2.  Tích hợp thành công lõi nhận diện cảm xúc từ `main.py` vào backend web.
3.  Triển khai các chế độ chơi:
    *   Chế độ cơ bản (3 vòng, vượt ngưỡng).
    *   Chế độ Thử Thách Thời Gian (Time Attack).
    *   Chế độ Bậc Thầy Cảm Xúc (Emotion Master).
    *   Chế độ Đo Cường Độ Cảm Xúc (Intensity Meter).
4.  Xây dựng hệ thống tính điểm và bảng xếp hạng cho người chơi.
5.  Cung cấp giao diện người dùng trực quan, hấp dẫn với các hiệu ứng (animations).
6.  Sử dụng TypeScript cho frontend và Flask cho backend.

## Đối Tượng Người Dùng
-   Những người quan tâm đến công nghệ AI, nhận diện cảm xúc.
-   Những người tìm kiếm một trò chơi web tương tác, giải trí nhẹ nhàng và có tính thử thách.

## Yêu Cầu Chính
-   **Chức năng:**
    *   Truy cập camera người dùng.
    *   Nhận diện cảm xúc từ video stream theo thời gian thực.
    *   Triển khai logic cho các chế độ chơi đã đề cập.
    *   Lưu trữ và hiển thị điểm số, bảng xếp hạng.
    *   Giao diện người dùng cho phép chọn chế độ chơi, hiển thị thông tin game, và kết quả.
-   **Phi chức năng:**
    *   Trải nghiệm người dùng mượt mà, phản hồi nhanh.
    *   Giao diện hấp dẫn, có sử dụng animations.
    *   Mã nguồn frontend dễ bảo trì với TypeScript.
    *   Backend hiệu quả với Flask.
