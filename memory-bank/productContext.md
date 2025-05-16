# Product Context

## Vấn Đề Cần Giải Quyết
-   Tạo ra một trải nghiệm giải trí tương tác và mới lạ sử dụng công nghệ nhận diện cảm xúc.
-   Cung cấp một cách thú vị để người dùng khám phá và thể hiện các cảm xúc khác nhau.
-   Tạo ra một sân chơi có tính cạnh tranh thông qua các chế độ chơi và bảng xếp hạng.

## Giải Pháp Đề Xuất
Một trò chơi web nơi người chơi phải biểu cảm khuôn mặt theo yêu cầu để vượt qua các thử thách. Trò chơi sẽ có nhiều chế độ chơi để tăng tính đa dạng và một bảng xếp hạng để khuyến khích người chơi cải thiện thành tích.

## Cách Thức Hoạt Động Mong Muốn

Người dùng truy cập trang web, chọn một chế độ chơi. Camera sẽ được kích hoạt.
Tùy theo chế độ chơi, người dùng sẽ nhận được yêu cầu thể hiện một cảm xúc cụ thể (hoặc một chuỗi cảm xúc, hoặc duy trì cường độ cảm xúc).
Hệ thống sẽ phân tích biểu cảm của người dùng qua camera và đưa ra phản hồi.
Nếu người dùng thể hiện đúng cảm xúc theo yêu cầu của chế độ chơi (ví dụ: vượt ngưỡng độ tin cậy, trong thời gian cho phép, duy trì cường độ), họ sẽ qua vòng hoặc ghi điểm.
Sau khi hoàn thành một lượt chơi, nếu điểm số đủ cao, người dùng có thể nhập tên để lưu vào bảng xếp hạng.
Người dùng có thể xem bảng xếp hạng để so sánh thành tích.

### Mô Tả Các Chế Độ Chơi:
1.  **Chế Độ Cơ Bản:**
    *   Người chơi trải qua 3 vòng.
    *   Mỗi vòng yêu cầu thể hiện một cảm xúc cụ thể.
    *   Để qua vòng, cảm xúc nhận diện phải khớp với yêu cầu và độ tin cậy vượt một ngưỡng nhất định (ví dụ: 0.9).
2.  **Chế Độ Thử Thách Thời Gian (Time Attack):**
    *   Người chơi phải thể hiện đúng cảm xúc yêu cầu trong một khoảng thời gian giới hạn cho mỗi vòng/cảm xúc.
    *   Thời gian có thể giảm dần hoặc điểm thưởng nếu hoàn thành nhanh.
3.  **Chế Độ Bậc Thầy Cảm Xúc (Emotion Master):**
    *   Game đưa ra một chuỗi các cảm xúc ngẫu nhiên liên tiếp.
    *   Người chơi phải thể hiện đúng từng cảm xúc để tiếp tục.
    *   Điểm số dựa trên số lượng cảm xúc thể hiện thành công liên tiếp.
4.  **Chế Độ Đo Cường Độ Cảm Xúc (Intensity Meter):**
    *   Yêu cầu người chơi duy trì cảm xúc mục tiêu ở một mức độ tin cậy nhất định (ví dụ: từ 0.85 đến 0.95) trong một khoảng thời gian ngắn (ví dụ: 2-3 giây) để qua màn.
    *   Giao diện sẽ có một thanh đo trực quan.

### Bảng Xếp Hạng:
-   Sau mỗi lượt chơi ở các chế độ có tính điểm, nếu người chơi đạt điểm cao, họ có thể nhập tên để lưu vào bảng xếp hạng.
-   Bảng xếp hạng sẽ hiển thị top người chơi (ví dụ: top 10) cho mỗi chế độ chơi hoặc một bảng xếp hạng tổng hợp.
-   Điều này khuyến khích sự cạnh tranh lành mạnh và tăng động lực chơi lại.

## Mục Tiêu Trải Nghiệm Người Dùng (UX)
-   **Hấp dẫn và Vui vẻ:** Trò chơi phải mang lại niềm vui và sự thích thú. Animations và phản hồi tức thì đóng vai trò quan trọng.
-   **Dễ hiểu, dễ chơi:** Luật chơi và cách tương tác phải rõ ràng ngay từ đầu.
-   **Thử thách vừa phải:** Độ khó của các chế độ chơi cần được cân bằng để không quá dễ gây nhàm chán hoặc quá khó gây nản lòng.
-   **Phản hồi rõ ràng:** Người chơi cần biết rõ khi nào họ làm đúng, khi nào sai, và tiến trình của mình.
-   **Tính tương tác cao:** Việc sử dụng camera và biểu cảm cá nhân tạo sự kết nối trực tiếp.
-   **Khuyến khích cải thiện:** Bảng xếp hạng và các chế độ chơi khác nhau tạo động lực để người chơi thử lại và cải thiện kỹ năng biểu cảm cũng như điểm số.
