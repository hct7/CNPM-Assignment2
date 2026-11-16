# BrewLite

BrewLite là ứng dụng đặt đồ uống cho bài tập lớn môn Công nghệ Phần mềm. Dự án gồm web Next.js, API NestJS và cơ sở dữ liệu PostgreSQL; Docker Compose khởi chạy cả ba dịch vụ.

## Tính năng

- Xem và tìm kiếm menu, lọc theo loại đồ uống; ảnh sản phẩm có ảnh dự phòng nếu nguồn ảnh không tải được.
- Xem chi tiết món, chọn kích cỡ và topping; giỏ hàng được lưu trên trình duyệt.
- Đăng ký, đăng nhập, tạo đơn, thanh toán mô phỏng và xem lịch sử đơn hàng.
- Áp dụng mã khuyến mãi từ PostgreSQL ở checkout; tích điểm loyalty sau thanh toán thành công.
- Trang quản trị `/admin` để theo dõi đơn theo trạng thái, cập nhật tiến độ pha chế và quản lý mã khuyến mãi.
- Nền sóng cà phê động ở landing page, phản ứng theo chuyển động chuột.
- API quản lý tồn kho bằng transaction và optimistic version check, xác thực người dùng, chống tạo đơn/thanh toán trùng bằng idempotency key và kiểm soát chuyển trạng thái đơn.

Thanh toán chỉ mô phỏng cho mục đích học tập; ứng dụng không nhận hoặc lưu thông tin thẻ thật.

## Công nghệ và cấu trúc

- **Web:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Three.js.
- **API:** NestJS 12, TypeScript, PostgreSQL (`pg`).
- **Hạ tầng local:** Docker Compose và PostgreSQL 16.

```text
apps/
  web/       Giao diện Next.js, component và kiểm thử trình duyệt
  api/       API NestJS, migrations và kiểm thử
deploy/      Cấu hình triển khai
docs/        Hướng dẫn triển khai và bàn giao
.github/     CI và release workflows
```

## Chạy toàn bộ ứng dụng bằng Docker

Yêu cầu Node.js 22+ và Docker Compose (ví dụ Docker Desktop đang chạy).

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Compose khởi chạy PostgreSQL, API và web; API tự áp dụng migrations khi khởi động. Mở:

- Web: <http://localhost:3000>
- API health: <http://localhost:3001/health>
- Menu API: <http://localhost:3001/products>

Tài khoản quản lý local được tạo/cập nhật từ `ADMIN_EMAIL` và `ADMIN_PASSWORD` trong `.env` khi API khởi động. Compose cho phép mật khẩu local từ 8 ký tự; khi triển khai production, cấu hình `ADMIN_PASSWORD_MIN_LENGTH=16` và dùng mật khẩu dài, riêng biệt. Các giá trị mẫu trong `.env.example` chỉ dành cho máy local.

Nhấn `Ctrl+C` để dừng. Dùng `docker compose down` để dừng dịch vụ nhưng giữ dữ liệu PostgreSQL; `docker compose down -v` sẽ xóa cả volume database.

## API chính

| Phương thức | Đường dẫn | Mục đích |
|---|---|---|
| `GET` | `/health` | Kiểm tra API và kết nối PostgreSQL |
| `GET` | `/products`, `/products/:id` | Danh sách và chi tiết menu |
| `POST` | `/auth/register`, `/auth/login` | Tạo tài khoản và đăng nhập |
| `POST` | `/orders` | Tạo đơn; cần bearer token và `Idempotency-Key` |
| `POST` | `/orders/:id/pay` | Thanh toán mô phỏng; cần bearer token và `Idempotency-Key` |
| `GET` | `/orders/me` | Lịch sử đơn của tài khoản đang đăng nhập |
| `PATCH` | `/orders/:id/status` | Cập nhật trạng thái đơn cho nhân viên/quản lý |
| `GET` | `/promotions` | Danh sách mã khuyến mãi đang hoạt động |
| `POST` | `/promotions/validate` | Kiểm tra mã với giá trị giỏ hàng |
| `GET` | `/loyalty/me` | Điểm và lịch sử loyalty của tài khoản |
| `GET` | `/admin/orders?status=PAID` | Lọc đơn (STAFF/MANAGER) |
| `GET`, `POST` | `/admin/promotions` | Xem/tạo mã (STAFF/MANAGER) |
| `PATCH` | `/admin/promotions/:id` | Bật/tắt mã (STAFF/MANAGER) |

API dùng `JWT_SECRET` để ký token, `WEB_ORIGIN` để cấu hình CORS và `PAYMENT_MOCK_MODE=success` (hoặc `fail`) để chọn kết quả thanh toán mô phỏng. Các giá trị local mẫu nằm trong `.env.example`; không dùng secret mẫu trong production.

## Kiểm tra và build

Chạy các lệnh trong thư mục ứng dụng tương ứng:

```powershell
# Web
cd apps/web
npm ci
npm run lint
npm test
npm run build

# API
cd ../api
npm ci
npm run lint
npm test
npm run build
```

API integration test cần PostgreSQL riêng cho test vì bộ test xóa dữ liệu bảng nghiệp vụ trước mỗi ca; không trỏ suite vào database đang dùng. Kiểm thử trình duyệt dùng Playwright và Chromium: chạy `npx playwright install chromium`, rồi `npm run test:e2e` trong `apps/web`; cấu hình Playwright tự khởi động API và web, vì vậy cần PostgreSQL local sẵn sàng.

CI chạy lint, unit test, API integration test, build và kiểm thử đặt hàng qua trình duyệt. Workflow nằm trong `.github/workflows/`.

## Triển khai

Hướng dẫn cấu hình Vercel cho web/API, PostgreSQL managed, biến môi trường, release và rollback nằm trong [docs/deployment.md](docs/deployment.md). Repo có workflow release, nhưng production chỉ được coi là triển khai xong sau khi đã cấu hình tài khoản/dịch vụ, chạy deploy và ghi lại URL cùng bằng chứng smoke test.

## Bảo mật và đóng góp

- Không commit `.env`, token, mật khẩu hoặc secret. Dùng secret riêng cho production.
- Giữ `main` ở trạng thái build được; tạo nhánh `feat/<issue>-<name>` hoặc `fix/<issue>-<name>` và mở PR kèm mô tả thay đổi, cách kiểm tra.
- Cập nhật README hoặc tài liệu liên quan khi thay đổi cách cài đặt, API hay triển khai.
