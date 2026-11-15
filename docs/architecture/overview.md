# Kiến trúc BrewLite

Phân lớp trong monorepo: Next.js 16 trình bày UI mobile-first; NestJS 12 tổ chức theo module; PostgreSQL lưu trạng thái giao dịch. Adapter payment mock tách khỏi nghiệp vụ để sau này thay cổng thật. Đây là modular monolith phù hợp nhóm nhỏ; trade-off là scale từng domain độc lập chưa cần thiết.

Browser/PWA --HTTPS--> Next.js web --HTTPS/private service--> NestJS API --TCP 5432/private--> PostgreSQL. API xác thực, tính giá, kiểm tra tồn và quyết định trạng thái. Migration version hóa; health check kiểm tra API/DB; log không chứa token/secret.

`DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN`, `PAYMENT_MOCK_MODE` lấy từ environment/secret store. `.env.example` chỉ giá trị local giả. DB không public; HTTPS kết thúc tại ingress. CI dùng commit SHA cho image tag; rollout chỉ thành công sau migration và smoke test. Rollback redeploy SHA trước; migration cần tương thích ngược.

Compose là môi trường local có thể tái tạo. Production provider, registry, hostnames, secret binding và health URL cần nhóm cấu hình. Deployment diagram mô tả topology mục tiêu, không phải bằng chứng production đã chạy.
