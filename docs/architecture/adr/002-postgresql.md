# ADR 002: PostgreSQL cho dữ liệu giao dịch

- Trạng thái: Accepted
- Bối cảnh: Đơn, item, tồn kho và payment cần nhất quán, có ràng buộc quan hệ.
- Quyết định: PostgreSQL; schema qua migration; tạo đơn và cập nhật tồn trong transaction.
- Hệ quả: Unique constraint cho idempotency; backup/restore phụ thuộc nền tảng production.
- Trade-off: Cần quản trị migration và connection pool; phù hợp hơn lưu phi quan hệ cho luồng này.
