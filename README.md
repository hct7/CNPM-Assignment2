# BrewLite

Monorepo học phần Công nghệ Phần mềm: Next.js 16 web, NestJS 12 API, PostgreSQL, Docker Compose. Luồng hiện có gồm menu, đăng ký/đăng nhập, giỏ chọn size, tạo đơn và thanh toán mô phỏng; chưa hoàn tất toàn bộ Task 5.

## Chạy local
Yêu cầu Node.js 22+ và Docker Compose. Sao chép `.env.example` thành `.env`, chạy `docker compose up --build`. Web tại http://localhost:3000; API health tại http://localhost:3001/health; menu tại http://localhost:3001/products.

## Kiểm tra
Chạy `npm install` ở `apps/api` và `apps/web`; sau đó `npm run lint`, `npm test`, `npm run build` trong từng app. CI nằm ở `.github/workflows/ci.yml`. Môi trường tạo bộ bài này không có Docker và không truy cập npm registry nên pipeline chưa được xác nhận chạy thành công.

## Cấu hình và bảo mật
Xem `.env.example`. Không commit `.env`, token hoặc secret. Thanh toán là mô phỏng, không lưu thông tin thẻ.

## Deploy / rollback
Topology và checklist ở `docs/deployment.md`; provider, secret và production URL cần nhóm bổ sung. Tag image theo commit SHA; rollback bằng redeploy SHA trước, migration tương thích ngược.

## Quy trình nhóm
`main` giữ trạng thái build được; nhánh `feat/<issue>-<name>` hoặc `fix/...`; PR gắn issue, nêu test và cần review; không merge khi CI đỏ. Conventional Commits. DoD: AC và truy vết, lint/test/build, docs cập nhật, không secret, PR review.

## Cần nhóm bổ sung
Tên thành viên/MSSV; URL repository và quyền giảng viên; PR/CI evidence; provider, URL production, release notes, video demo và retrospective. Không có bằng chứng thật thì không được coi checklist deployment đã hoàn tất.
