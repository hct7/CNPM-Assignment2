# ADR 001: Monorepo modular monolith

- Trạng thái: Accepted cho MVP học phần
- Bối cảnh: Nhóm cần giữ Next.js, NestJS, tài liệu và CI đồng bộ trong một kho.
- Quyết định: Monorepo với `apps/web`, `apps/api`, `docs`, Compose; backend NestJS modular monolith.
- Hệ quả tích cực: Một PR cập nhật API/UI cùng nhau; CI/hướng dẫn tập trung.
- Trade-off: Pipeline có thể build phần không đổi; release độc lập kém hơn polyrepo.
- Rủi ro: Phụ thuộc tăng thời gian cài; dùng npm và cache CI khi tối ưu.
