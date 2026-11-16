# ADR 003: Versioned SQL migrations

- Trạng thái: Accepted
- Bối cảnh: Local, CI và production phải tạo cùng schema và seed; deploy rolling không được chạy migration trùng đồng thời.
- Quyết định: Lưu SQL tuần tự trong `apps/api/db/migrations`; API chạy runner trước khi mở HTTP listener. Runner lưu tên file trong `schema_migrations` và dùng PostgreSQL advisory lock; mỗi file chạy trong transaction.
- Hệ quả tích cực: Fresh database có thể dựng lại; CI smoke/integration dùng cùng schema với local và production.
- Trade-off: Migrations production phải tương thích ngược khi có nhiều phiên bản API đang chạy; rollback chỉ đổi image, không tự reverse DDL.
- Bảo mật: SQL dùng tham số cho dữ liệu động; secret DB chỉ từ runtime environment.
