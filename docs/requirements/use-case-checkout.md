# UC-01 - Đặt và thanh toán đơn hàng

| Thuộc tính | Mô tả |
|---|---|
| Actor chính | Customer đã đăng nhập |
| Actor phụ | Payment Service mô phỏng |
| Trigger | Khách chọn Thanh toán từ giỏ |
| Tiền điều kiện | JWT hợp lệ; giỏ không rỗng; sản phẩm active, đủ tồn |
| Hậu điều kiện thành công | Đơn lưu, tồn giảm một lần, payment SUCCESS, khách nhận mã |
| Hậu điều kiện thất bại | Không thanh toán trùng; tồn và trạng thái nhất quán |
| Yêu cầu | FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-11; NFR-02, NFR-04, NFR-08 |

## Luồng chính
1. Khách xem giỏ, chọn Wallet hoặc Card demo.
2. UI gửi POST /orders kèm JWT và Idempotency-Key.
3. API xác thực JWT, validate payload, đọc giá/tùy chọn từ DB.
4. Transaction kiểm tra tồn, tạo Order/OrderItem, giảm tồn và gắn key.
5. UI gửi POST /orders/{id}/pay cùng khóa idempotency.
6. API trả kết quả cũ nếu khóa đã xử lý; nếu chưa gọi adapter mô phỏng.
7. API lưu payment và trạng thái, trả mã đơn/tổng tiền/trạng thái.
8. UI hiện xác nhận; khách theo dõi ở lịch sử.

## Luồng thay thế và ngoại lệ
- A1 Chưa đăng nhập: 401; UI giữ giỏ, yêu cầu đăng nhập và xác nhận lại.
- A2 Sản phẩm không active: rollback, 409; UI yêu cầu cập nhật giỏ.
- A3 Hết hàng: rollback toàn bộ, 409; không tạo đơn cần thanh toán.
- A4 Payment thất bại: ghi FAILED; tồn được hoàn lại một lần; đơn ở trạng thái cuối, cần tạo đơn mới nếu khách muốn thử lại.
- A5 Timeout sau xử lý: retry cùng key trả cùng kết quả.
- A6 Payload sai/giá client sửa: 400; backend không tin giá client.
- A7 Đơn không tồn tại/không thuộc khách: 404.

## Quy tắc
- Giá VND là số nguyên, backend tự tính tổng.
- Idempotency key unique theo user và operation; client retry cùng key nhận kết quả cũ.
- Không lưu PAN, CVV hoặc token thật.
- Tồn kho và trạng thái cập nhật qua transaction phù hợp.
