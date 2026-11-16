# Deployment và bàn giao

## Mục tiêu production

Production dùng **Vercel** cho hai project độc lập trong cùng repository: Next.js (`apps/web`) và NestJS (`apps/api`). PostgreSQL là dịch vụ managed bên ngoài, chỉ API có thông tin kết nối. Cả hai URL dùng HTTPS do Vercel cấp. Không chạy database trong Vercel Function và không mở database công khai.

Vercel hỗ trợ Next.js trực tiếp và nhận diện NestJS từ `apps/api/src/main.ts`; API chạy như một Vercel Function. Local Docker Compose vẫn được giữ để tái tạo web/API/PostgreSQL khi phát triển và kiểm thử tích hợp.

## Tạo projects và cấu hình môi trường

1. Tạo một PostgreSQL database managed (ví dụ qua Vercel Marketplace). Bật SSL theo yêu cầu provider; giữ connection string và password ngoài Git.
2. Tạo Vercel project `brewlite-api` với Root Directory `apps/api`, framework NestJS/auto-detected. Tạo project `brewlite-web` với Root Directory `apps/web`, framework Next.js/auto-detected. Gắn cả project vào cùng repository nếu cần deployment previews.
3. Trong project API, đặt `DATABASE_URL`, `JWT_SECRET` (ít nhất 32 ký tự ngẫu nhiên), `WEB_ORIGIN` bằng production URL frontend và `PAYMENT_MOCK_MODE=success`. Chọn Production environment; thêm giá trị Preview riêng khi dùng preview URLs.
4. Trong project web, đặt `NEXT_PUBLIC_API_URL` thành URL production của API (không thêm dấu `/` cuối). Redeploy sau khi đổi biến build-time.
5. Lấy Vercel Access Token, Organization ID và Project ID của từng project. Trong GitHub repository tạo Environment `production` với secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_API_PROJECT_ID`, `VERCEL_WEB_PROJECT_ID`; thêm variables `API_PRODUCTION_URL` và `WEB_PRODUCTION_URL` (đầy đủ `https://...`). Không commit token, connection string hay JWT secret.
6. Bảo vệ nhánh `main`: yêu cầu CI thành công trước merge. Tạo tag `vX.Y.Z` để chạy pipeline release. Workflow `.github/workflows/release.yml` gọi CI, pull cấu hình Vercel, build artifacts, deploy API rồi web, kiểm tra `/health` và trang web qua HTTPS; nếu deploy hoặc smoke test lỗi, workflow yêu cầu Vercel rollback project đã triển khai.
7. Ghi lại URL production, commit/tag, link workflow thành công và release notes. Chạy demo menu → tạo đơn → thanh toán → lịch sử; hoàn tất Sprint Review và Retrospective.

## Database và vận hành

API chạy migration version hóa khi khởi tạo. Migration runner giữ advisory lock trong PostgreSQL để các cold start/instance không áp dụng cùng migration đồng thời; mỗi migration được ghi nhận trong bảng `schema_migrations`. Dùng PostgreSQL provider có SSL và giới hạn kết nối phù hợp serverless. Connection pooling có thể đặt qua provider/pooler nếu giới hạn kết nối yêu cầu.

Vercel Functions không phải tiến trình nền thường trực. Không dùng lịch chạy trong bộ nhớ; nếu bổ sung tác vụ định kỳ, chuyển sang Vercel Cron hoặc dịch vụ job riêng. Theo dõi function logs/health sau deploy. Rollback ứng dụng qua Vercel không tự đảo migration phá hủy dữ liệu; mọi thay đổi schema phải tương thích ngược trước khi phát hành.

## Trạng thái bằng chứng

Repository hiện đã có cấu hình release workflow và hướng dẫn Vercel; **production chưa được deploy**. Cần tạo/cấu hình hai Vercel projects, managed PostgreSQL, GitHub Environment/secrets/variables rồi push tag và ghi lại log/URL thật. Không dùng cấu hình mục tiêu làm bằng chứng production.
