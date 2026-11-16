# Trạng thái hồ sơ nộp assignment

| Task | Trạng thái hiện tại | Bằng chứng / phần còn thiếu |
|---|---|---|
| 1 - Yêu cầu | Tài liệu đã soạn | Context/scope, SRS MoSCoW, AC và UC-01 trong `docs/requirements/` |
| 2 - Mô hình hóa | Sơ đồ nguồn đã tạo | Activity, sequence, class, use-case, order state machine; sequence có SVG render; chưa có kiểm tra render PlantUML tự động |
| 3 - Kiến trúc | Thiết kế và target deploy đã chọn | Overview, ADR, deployment diagram VPS+Caddy+GHCR; VPS/domain chưa provision |
| 4 - Sprint 1 | Tạo phẩm local có đủ khung | Git local, Next.js/NestJS/PostgreSQL, seed, GET products, health, menu mobile-first, CI workflow; remote/PR/branch protection và bằng chứng pipeline cần chạy trên GitHub |
| 5 - Sprint 2 + delivery | Tạo phẩm code và pipeline đã có; production chưa chạy | Checkout UI có size/topping, auth, idempotency, stock transaction, payment mock, lịch sử, state machine, migration, API integration, browser E2E test và CD VPS workflow; loyalty/promotion chưa vận hành; cần chạy CI/deploy thật, cấu hình secrets/DNS, quay demo và retrospective |

## Cần nhóm cung cấp hoặc thực hiện

- Thành viên và MSSV để điền hồ sơ trường.
- Remote repository, quyền truy cập giảng viên, issue board, PR và branch protection.
- Cài dependencies/ Docker trên máy có kết nối registry, chạy lint/test/build và lưu log CI thành công/lỗi.
- Tạo GitHub remote, bật branch protection, thêm secrets/DNS/VPS; push tag và kiểm tra URL HTTPS thật.
- Chạy test integration/E2E, release notes, video demo và Sprint Review/Retrospective; lấy log thật làm bằng chứng.

Không dùng các mục “đã có trong mã nguồn” làm minh chứng triển khai hoặc kiểm thử nếu chưa có log thực thi tương ứng.
