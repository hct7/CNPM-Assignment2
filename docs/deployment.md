# Deployment và bàn giao

## Local
1. Cài Docker Desktop và Compose.
2. Sao chép `.env.example` thành `.env`, thay JWT secret cho local.
3. `docker compose up --build`.
4. Web: http://localhost:3000; API health: http://localhost:3001/health.
5. Dừng bằng `docker compose down`; dữ liệu trong volume `postgres_data`.

API chạy migration version hóa và seed khi khởi động. Không dùng `.env` local làm secret production.

## VPS production target

Production Compose dùng Caddy để cấp HTTPS và reverse proxy hai domain, Next.js và NestJS chạy trong mạng riêng, PostgreSQL chỉ ở backend network với persistent volume. Không publish cổng DB ra host. API migration có version và khóa advisory để tránh hai replica chạy cùng migration.

1. Tạo VPS Linux có Docker Compose, mở inbound 80/443 và SSH giới hạn theo IP; trỏ `WEB_DOMAIN` và `API_DOMAIN` về VPS.
2. Tạo GitHub Container Registry packages cho repository. Nếu package private, đăng nhập GHCR trên VPS bằng token read-only; giữ credential ngoài repository.
3. Tạo `/opt/brewlite/.env` từ `deploy/production/.env.example`; điền mật khẩu/secret mạnh, `IMAGE_PREFIX` chữ thường, domains thật và `DATABASE_URL` có password URL-encoded. File này chỉ nằm trên server.
4. Thêm GitHub repository variable `NEXT_PUBLIC_API_URL=https://<API_DOMAIN>`.
5. Tạo GitHub Environment `production`; thêm secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`. Host key phải được xác minh độc lập trước khi lưu.
6. Push tag semver `vX.Y.Z`. `.github/workflows/release.yml` gọi CI, build/push image theo SHA, chuyển compose/Caddy/deploy script qua SSH, chạy migration khi API khởi động, smoke test URL và rollback về image trước nếu health check lỗi; sau đó tạo GitHub release notes.
7. Ghi lại URL, SHA, log pipeline và release. Quay video luồng menu→đặt hàng→PAID; làm Sprint Review/Retrospective.

Migration cần tương thích ngược trước khi deploy. Rollback đổi image về SHA trước; migration phá hủy dữ liệu cần kế hoạch riêng. `PAYMENT_MOCK_MODE=fail` dùng để trình diễn nhánh thanh toán lỗi; production demo mặc định `success`.

**Production chưa được triển khai từ workspace này:** chưa có remote GitHub, DNS, VPS, SSH secrets hay URL để kiểm tra. Cấu hình pipeline đã chuẩn bị nhưng phải cung cấp các giá trị môi trường trên và push tag trước khi có thể xác nhận delivery.
