# Deployment và bàn giao

## Local
1. Cài Docker Desktop và Compose.
2. Sao chép `.env.example` thành `.env`, thay JWT secret cho local.
3. `docker compose up --build`.
4. Web: http://localhost:3000; API health: http://localhost:3001/health.
5. Dừng bằng `docker compose down`; dữ liệu trong volume `postgres_data`.

Compose chạy migration/seed khi API khởi động. Không dùng `.env` local làm secret production.

## Production checklist - chưa xác nhận
- Chọn provider, private PostgreSQL, registry, web/API services.
- Đặt `DATABASE_URL`, `JWT_SECRET`, origin trong secret store; không ghi vào repo/log.
- API chỉ nhận truy cập từ web/ingress; DB không public.
- Build image theo SHA, deploy, migration tương thích ngược, gọi `/health`, smoke test.
- Nếu lỗi, redeploy SHA trước; xem migration rollback policy trước khi đổi schema.
- Ghi URL HTTPS, release/tag, notes, demo và retrospective sau triển khai thật.

Chưa có URL production hoặc credentials trong workspace nên không tuyên bố đã deploy.
