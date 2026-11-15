# Trạng thái hồ sơ nộp assignment

| Task | Trạng thái hiện tại | Bằng chứng / phần còn thiếu |
|---|---|---|
| 1 - Yêu cầu | Tài liệu đã soạn | Context/scope, SRS MoSCoW, AC và UC-01 trong `docs/requirements/` |
| 2 - Mô hình hóa | Sơ đồ nguồn đã tạo | Activity, sequence, class, use-case; sequence có SVG render; chưa có kiểm tra render PlantUML tự động |
| 3 - Kiến trúc | Thiết kế mục tiêu | Overview, 2 ADR, deployment diagram; provider thực tế còn TBD |
| 4 - Sprint 1 | Nền tảng local đã có | Git local (2 commit), Next.js/NestJS/PostgreSQL, seed, GET products, health, menu mobile-first, CI workflow; chưa có remote GitHub/PR/branch protection và CI chưa chạy |
| 5 - Sprint 2 + delivery | Chưa hoàn tất | API auth/order/payment mock và checkout UI cơ bản đã có; thiếu topping, UI lịch sử/tracking, staff status, migration runner, integration/E2E, CD, production URL, release, demo và retrospective |

## Cần nhóm cung cấp hoặc thực hiện

- Thành viên và MSSV để điền hồ sơ trường.
- Remote repository, quyền truy cập giảng viên, issue board, PR và branch protection.
- Cài dependencies/ Docker trên máy có kết nối registry, chạy lint/test/build và lưu log CI thành công/lỗi.
- Chọn provider production, cấu hình secret an toàn, chạy migration/smoke test; điền URL HTTPS thật.
- Hoàn thiện test integration/E2E, release notes, video demo và Sprint Review/Retrospective.

Không dùng các mục “đã có trong mã nguồn” làm minh chứng triển khai hoặc kiểm thử nếu chưa có log thực thi tương ứng.
