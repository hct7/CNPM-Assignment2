# Ma trận truy vết

| Yêu cầu | User story / Use-case | Thiết kế | Code/API đích MVP | Test |
|---|---|---|---|---|
| FR-01 | US-01 xem menu | Activity-01, Class Product | GET /products | API-T01, E2E-T01 |
| FR-02 | US-02 xem chi tiết | Class Product, Sequence-01 | GET /products/:id | API-T02 |
| FR-03 | US-03 quản lý giỏ | Activity-01 | Client cart in menu page | Chưa có E2E |
| FR-04, NFR-02 | US-04 xác thực | Sequence-01 | POST /auth/register, /auth/login | Chưa có integration test |
| FR-05, FR-11, NFR-04 | UC-01 đặt đơn | Activity-01, Sequence-01, Class Order | POST /orders | Chưa có integration test |
| FR-06, NFR-08 | UC-01 thanh toán | Sequence-01, Class Payment | POST /orders/:id/pay | Chưa có integration test |
| FR-07 | US-05 lịch sử | Class Order | GET /orders/me | Chưa có integration test |
| FR-08 | US-06 cập nhật trạng thái | Class Order | Chưa triển khai | Chưa có test |
| FR-09 | US-07 promotion/loyalty | Class Promotion/LoyaltyTransaction | Domain planned | deferred |
| NFR-01, NFR-07 | US-01 | Architecture overview | Next.js responsive | manual viewport review |
| NFR-03, NFR-05 | vận hành | Deployment-01 | GET /health, Compose | smoke test |
| NFR-06 | developer workflow | ADR-001 | GitHub Actions CI | CI checks |

Chỉ API-T01/T02 có kiểm tra unit dữ liệu mẫu; chưa có test HTTP/integration/E2E. Test IDs còn thiếu là công việc cần hoàn thiện trước nghiệm thu. Mã nguồn hiện là nền tảng MVP, chưa đáp ứng toàn bộ Task 5.
