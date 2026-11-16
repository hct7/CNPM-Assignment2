# Ma trận truy vết

| Yêu cầu | User story / Use-case | Thiết kế | Code/API đích MVP | Test |
|---|---|---|---|---|
| FR-01 | US-01 xem menu | Activity-01, Class Product | GET /products | API-01 controller unit; E2E-01 |
| FR-02 | US-02 xem chi tiết | Class Product, Sequence-01 | GET /products/:id | API-01 controller unit |
| FR-03 | US-03 quản lý giỏ | Activity-01 | LocalStorage cart: add/edit/remove, size/topping | E2E-01 |
| FR-04, NFR-02 | US-04 xác thực | Sequence-01 | POST /auth/register, /auth/login + web modal | API-02 JWT unit; INT-01; E2E-01 |
| FR-05, FR-11, NFR-04 | UC-01 đặt đơn | Activity-01, Sequence-01, Class Order | POST /orders + transaction/stock lock | INT-01, INT-03 |
| FR-06, NFR-08 | UC-01 thanh toán | Sequence-01, Class Payment | POST /orders/:id/pay + mock Wallet/Card | INT-01, INT-02; E2E-01 |
| FR-07 | US-05 lịch sử | Class Order | GET /orders/me + web history | INT-01; E2E-01 |
| FR-08 | US-06 cập nhật trạng thái | Activity-01, Order State Machine | PATCH /orders/:id/status, vai trò STAFF/MANAGER | API-03 state unit; INT-01 |
| FR-09 | US-07 promotion/loyalty | Class Promotion/LoyaltyTransaction | Domain planned | deferred |
| NFR-01, NFR-07 | US-01 | Architecture overview | Next.js responsive | manual viewport review |
| NFR-03, NFR-05 | vận hành | Deployment-01 | GET /health, Compose | smoke test |
| NFR-06 | developer workflow | ADR-001 | GitHub Actions CI | CI checks |

Test IDs: API-01 `products.spec.ts`; API-02 `auth.spec.ts`; API-03 `order-state.spec.ts`; INT-01/02/03 `checkout.e2e-spec.ts` (HTTP integration với PostgreSQL); E2E-01 `apps/web/e2e/checkout.spec.ts` (trình duyệt). Các test đã được viết nhưng chưa chạy trong workspace này vì không có Docker/PostgreSQL và dependencies npm chưa được cài; log thật sẽ có sau khi CI chạy.
