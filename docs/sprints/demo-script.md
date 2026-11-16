# Kịch bản demo Assignment 2 (5-7 phút)

> Dùng như checklist quay video sau khi CI xanh và môi trường chạy được. Không ghi credentials/secret vào video.

1. **Bối cảnh (30s):** giới thiệu BrewLite, mục tiêu đặt đồ uống không tiền mặt và stack Next.js/NestJS/PostgreSQL.
2. **Menu mobile (45s):** mở ở viewport điện thoại, chỉ loading hoàn tất, lọc menu, xem chi tiết.
3. **Tùy chỉnh/giỏ (60s):** chọn size và topping, thêm món, sửa số lượng, cho thấy tổng tiền.
4. **Tài khoản (45s):** đăng ký/đăng nhập demo bằng email thử nghiệm.
5. **Checkout thành công (60s):** chọn Ví/Thẻ mô phỏng, thanh toán, chỉ mã đơn và trạng thái PAID; mở lịch sử.
6. **Lỗi thanh toán (45s):** trên môi trường demo bật `PAYMENT_MOCK_MODE=fail`, thanh toán, chỉ PAYMENT_FAILED và giỏ vẫn còn; bật success rồi thử lại.
7. **Vận hành (45s):** gọi API `/health`, chỉ CI xanh, tag release, GitHub Actions deploy Vercel và URL HTTPS nếu đã deploy.
8. **Kết thúc (30s):** nêu feedback/sprint review và retrospective thật của nhóm.
