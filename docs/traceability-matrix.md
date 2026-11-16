# Ma trận truy vết

| Yêu cầu | User story / Use-case | Thiết kế | Code/API đích MVP | Test |
|---|---|---|---|---|
| FR-01 | US-01 xem menu | Activity-01, Class Product | GET /products | API-01 controller unit; E2E-01 |
| FR-02 | US-02 xem chi tiết | Class Product, Sequence-01 | GET /products/:id | API-01 controller unit |
| FR-03 | US-03 quản lý giỏ | Activity-01 | LocalStorage cart: add/edit/remove, size/topping | E2E-01 |
| FR-04, NFR-02 | US-04 xác thực | Sequence-01 | POST /auth/register, /auth/login + web modal | API-02 JWT unit; INT-01; E2E-01 |
| FR-05, FR-11, NFR-04 | UC-01 đặt đơn | Activity-01, Sequence-01, Class Order | POST /orders + transaction/optimistic stock version check | INT-01, INT-03 |
| FR-06, NFR-08 | UC-01 thanh toán | Sequence-01, Class Payment | POST /orders/:id/pay + mock Wallet/Card | INT-01, INT-02; E2E-01 |
| FR-07 | US-05 lịch sử | Class Order | GET /orders/me + web history | INT-01; E2E-01 |
| FR-08 | US-06 cập nhật trạng thái và kiểm tra đơn | Activity-01, Order State Machine | GET /admin/orders, PATCH /orders/:id/status, giao diện `/admin`, vai trò STAFF/MANAGER | INT-04; E2E-02 |
| FR-09 | US-07 promotion/loyalty | Class Promotion/LoyaltyTransaction | GET/POST `/promotions`, `/promotions/validate`, `/admin/promotions`, `/loyalty/me`; áp mã trong checkout và ghi điểm khi thanh toán | API promotion unit; INT-04; E2E-01/02 |
| NFR-01, NFR-07 | US-01 | Architecture overview | Next.js responsive | manual viewport review |
| NFR-03, NFR-05 | vận hành | Deployment-01 | GET /health, Compose | smoke test |
| NFR-06 | developer workflow | ADR-001 | GitHub Actions CI | CI checks |

Test files: API unit tests trong `apps/api/test/*.spec.ts`; HTTP integration và PostgreSQL trong `apps/api/test/checkout.e2e-spec.ts`; trình duyệt trong `apps/web/e2e/checkout.spec.ts`. Chạy integration chỉ với database test riêng vì suite làm sạch các bảng nghiệp vụ.
