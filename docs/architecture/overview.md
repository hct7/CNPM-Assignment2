# Kiến trúc BrewLite

Phân lớp trong monorepo: Next.js 16 với manifest cài đặt trình bày UI mobile-first; NestJS 12 tổ chức theo module; PostgreSQL lưu trạng thái giao dịch. PWA hiện chưa có service worker/offline cache. Adapter payment mock tách khỏi nghiệp vụ để sau này thay cổng thật. Đây là modular monolith phù hợp nhóm nhỏ; trade-off là scale từng domain độc lập chưa cần thiết.

Browser/PWA --HTTPS--> Next.js web và NestJS API trên Vercel. API --TLS--> PostgreSQL managed. API xác thực, tính giá, kiểm tra tồn và quyết định trạng thái. Migration version hóa; health check kiểm tra API/DB; log không chứa token/secret.

`DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN`, `PAYMENT_MOCK_MODE` lấy từ environment/secret store. `.env.example` chỉ giá trị local giả. Production chạy Next.js và NestJS thành hai Vercel projects; API kết nối PostgreSQL managed qua TLS. CI kiểm tra mã nguồn trước release; GitHub Actions deploy bằng Vercel CLI theo tag, smoke test HTTPS và rollback qua Vercel khi lỗi.

Compose là môi trường local có thể tái tạo. Production target là Vercel + managed PostgreSQL; URLs, project IDs, credentials và secret binding còn cần nhóm cấu hình. Deployment diagram ghi rõ topology mục tiêu chưa provision, không phải bằng chứng production đã chạy.
