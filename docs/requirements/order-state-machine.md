# Order State Machine

Vòng đời theo tài liệu BrewLite: `PENDING → PAID → PREPARING → READY → COMPLETED`. Nhánh lỗi: `PENDING → PAYMENT_FAILED → PENDING` khi thử thanh toán lại bằng idempotency key mới hoặc `CANCELLED`. `CANCELLED` và `COMPLETED` là trạng thái cuối. API từ chối mọi chuyển tiếp khác.

Thanh toán thành công tự chuyển `PENDING → PAID`. Nhân viên có vai trò STAFF/MANAGER được chuyển trạng thái nghiệp vụ sau thanh toán. Mọi cập nhật nhân viên khóa dòng đơn trong transaction để tránh hai cập nhật đồng thời dựa trên cùng trạng thái cũ.

Mã transition nằm ở `apps/api/src/order-state.ts`; kiểm thử unit xác nhận đường đi thành công và chặn đường đi sai.
