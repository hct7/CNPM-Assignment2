# BrewLite - bối cảnh và phạm vi

## Bối cảnh nghiệp vụ
BrewLite là ứng dụng đặt đồ uống cho một cửa hàng cà phê. Khách cần xem menu, tùy chỉnh đồ uống, đặt và theo dõi đơn trên điện thoại; nhân viên cần nhận thông tin đơn nhất quán; quản lý cần duy trì danh mục và theo dõi hoạt động. MVP kiểm chứng luồng số hóa đặt hàng. Thanh toán trong bản demo là mô phỏng, không thu tiền thật.

## Stakeholder
| Stakeholder | Mục tiêu / kỳ vọng | Cách xác nhận |
|---|---|---|
| Khách hàng | Tìm đồ uống, tùy chỉnh, đặt đơn và biết kết quả | Kiểm thử luồng menu đến xác nhận |
| Nhân viên quầy | Nhìn thấy đơn và cập nhật trạng thái chính xác | Kiểm thử danh sách và chuyển trạng thái |
| Quản lý cửa hàng | Quản lý sản phẩm, giá, tồn kho và xem lịch sử | Kiểm thử quyền quản trị và dữ liệu |
| Giảng viên/người nghiệm thu | Clone, chạy, kiểm tra truy vết và xem demo | README, CI, smoke test và demo |
| Nhóm phát triển | Phát triển có kiểm soát, tái tạo môi trường | PR, CI, migration, review |
| Đơn vị thanh toán | Giao tiếp qua giao diện tích hợp an toàn | Adapter mô phỏng; không kết nối nhà cung cấp thật |

## Phạm vi
**Mục tiêu MVP theo đề:** xem menu/chi tiết, size và topping, giỏ hàng, đăng ký/đăng nhập, tạo đơn, thanh toán mô phỏng Ví/Thẻ, xác nhận, lịch sử đơn, cập nhật trạng thái bởi nhân viên, health check, logging, PostgreSQL và Compose. **Phần hiện có trong mã nguồn:** menu, chi tiết cơ bản, lựa chọn size, giỏ, đăng ký/đăng nhập JWT, tạo đơn transaction, payment mock Ví/Thẻ, health và API lịch sử. Lựa chọn topping, giao diện lịch sử/tracking, cập nhật trạng thái nhân viên, migration runner, integration/E2E tests và triển khai production còn thiếu.

**Mở rộng:** PWA cài đặt/offline, khuyến mãi và loyalty đầy đủ, nhiều chi nhánh, báo cáo, thông báo push, cổng thanh toán thực, phân quyền quản trị chi tiết.

**Ngoài phạm vi:** thu tiền thật, hoàn tiền qua ngân hàng, giao vận bên thứ ba, kế toán, quản lý chuỗi cung ứng.

## Giả định và ràng buộc
- Đây là sản phẩm học phần; dữ liệu demo không đại diện cửa hàng thật.
- Next.js, NestJS và PostgreSQL là bắt buộc. HTTPS khi triển khai; nội bộ Docker dùng network riêng.
- Giá lưu VND số nguyên; máy chủ là nguồn sự thật cho giá và tồn kho.
- Thanh toán mô phỏng thành công/thất bại; không lưu thông tin thẻ.
- Tên thành viên, MSSV, repository từ xa, hosting, registry và URL production chưa được cung cấp; cần nhóm bổ sung.

## Rủi ro
| Rủi ro | Tác động | Giảm thiểu |
|---|---|---|
| Gửi lặp yêu cầu tạo đơn | Trùng đơn/thu tiền | Idempotency key, unique constraint và test retry |
| Tranh chấp tồn kho | Bán vượt tồn | Transaction và cập nhật có điều kiện |
| Payment timeout | Trạng thái không rõ | PENDING, retry idempotent, reconciliation demo |
| Lộ secret | Truy cập trái phép | Secret runtime, .env gitignored, không log |
| Môi trường khác local | Không khởi động | Compose, migration và smoke test |
