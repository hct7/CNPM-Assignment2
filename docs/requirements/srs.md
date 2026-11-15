# BrewLite - SRS rút gọn

Ưu tiên: Must = bắt buộc MVP; Should = nên có; Could = mở rộng; Won't = không làm trong assignment. AC là tiêu chí kiểm chứng.

| ID | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-01 | Khách xem menu đang bán | Must | GET /products trả sản phẩm active; UI có loading, empty, error |
| FR-02 | Xem chi tiết, size, topping và giá | Must | GET /products/:id trả tùy chọn; API xác nhận tổng giá |
| FR-03 | Quản lý giỏ hàng | Must | Thêm/sửa/xóa; tổng tiền đúng theo số lượng/tùy chọn |
| FR-04 | Đăng ký/đăng nhập | Must | JWT hợp lệ; mật khẩu băm; sai thông tin bị từ chối |
| FR-05 | Tạo đơn | Must | POST /orders cần JWT và Idempotency-Key; lưu snapshot giá/items |
| FR-06 | Thanh toán mô phỏng | Must | SUCCESS/FAILED; retry cùng key không tạo payment trùng |
| FR-07 | Xem xác nhận và lịch sử đơn | Must | Chỉ xem đơn của mình; trạng thái/tổng tiền nhất quán |
| FR-08 | Nhân viên cập nhật trạng thái | Should | Chỉ STAFF/ADMIN chuyển trạng thái hợp lệ, có timestamp |
| FR-09 | Promotion và loyalty | Could | Domain mô hình hóa; vận hành có thể để sprint sau |
| FR-10 | Quản lý danh mục | Should | Quản trị viên sửa/ẩn; giá không âm |
| FR-11 | Không đặt khi hết hàng | Must | Transaction từ chối nguyên tử, không trừ tồn một phần |
| FR-12 | Hủy giỏ/đơn chưa thanh toán | Could | Chỉ trạng thái hợp lệ; hoàn tồn đúng một lần |
| NFR-01 | Hiệu năng | Should | P95 GET /products < 500 ms local với 100 sản phẩm, không tính cold start |
| NFR-02 | Bảo mật | Must | Hash mật khẩu, JWT secret từ env, DTO validation, không trả secret |
| NFR-03 | Khả dụng | Should | /health báo API/DB; lỗi UI dễ hiểu |
| NFR-04 | Toàn vẹn | Must | Order/items/trừ tồn trong transaction; idempotency unique |
| NFR-05 | Triển khai | Must | Compose chạy web/API/DB; migration/seed tái tạo DB |
| NFR-06 | Bảo trì | Should | Lint, unit/integration, build tự động trên PR |
| NFR-07 | Mobile-first | Must | Dùng được từ viewport 360px, keyboard accessible |
| NFR-08 | Riêng tư thanh toán | Must | Không lưu PAN/CVV; chỉ lưu provider reference/trạng thái |

## Use-case tổng quát
```plantuml
@startuml
left to right direction
actor Customer
actor Staff
actor Manager
actor "Mock Payment Service" as Payment
rectangle BrewLite {
 usecase "Xem menu / chi tiết" as UC1
 usecase "Đăng ký / đăng nhập" as UC2
 usecase "Tùy chỉnh và quản lý giỏ" as UC3
 usecase "Đặt và thanh toán đơn" as UC4
 usecase "Xem lịch sử / trạng thái" as UC5
 usecase "Cập nhật trạng thái đơn" as UC6
 usecase "Quản lý sản phẩm" as UC7
 usecase "Xử lý giao dịch mô phỏng" as UC8
}
Customer --> UC1
Customer --> UC2
Customer --> UC3
Customer --> UC4
Customer --> UC5
Staff --> UC6
Manager --> UC7
UC4 .> UC8 : <<include>>
Payment --> UC8
@enduml
```
