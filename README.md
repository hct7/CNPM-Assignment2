# BrewLite

Monorepo học phần Công nghệ Phần mềm: Next.js 16 web, NestJS 12 API, PostgreSQL, Docker Compose. Luồng hiện có gồm menu, đăng ký/đăng nhập, giỏ chọn size, tạo đơn và thanh toán mô phỏng; chưa hoàn tất toàn bộ Task 5.

## Chạy local
Yêu cầu Node.js 22+ và Docker Compose. Sao chép `.env.example` thành `.env`, chạy `docker compose up --build`. Web tại http://localhost:3000; API health tại http://localhost:3001/health; menu tại http://localhost:3001/products. DB local chỉ bind `127.0.0.1:5432` để chạy integration test trên máy.

## Kiểm tra
Chạy `npm install` ở `apps/api` và `apps/web`; sau đó `npm run lint`, `npm test`, `npm run build` trong từng app. API integration test cần PostgreSQL local: đặt `DATABASE_URL=postgresql://brewlite:local_dev_only_change_me@localhost:5432/brewlite` và `JWT_SECRET` trong terminal rồi chạy `npm run test:integration` tại `apps/api`. Browser E2E: khởi chạy `docker compose up --build`, cài Chromium bằng `npx playwright install chromium`, rồi chạy `npm run test:e2e` tại `apps/web`; Playwright kết nối tới web/API đang chạy. CI nằm ở `.github/workflows/ci.yml`.

## Cấu hình và bảo mật
Xem `.env.example`. Không commit `.env`, token hoặc secret. Thanh toán là mô phỏng, không lưu thông tin thẻ.

## Deploy / rollback
Hướng dẫn VPS, Caddy HTTPS, GHCR, smoke test và rollback ở `docs/deployment.md` và `deploy/production/`. Push tag `vX.Y.Z` chạy CI, publish Docker images theo SHA, deploy bằng SSH secrets và tạo GitHub release. Cần cấu hình biến `NEXT_PUBLIC_API_URL`, GitHub Environment `production`, SSH secrets và VPS `.env` trước khi dùng.

## Quy trình nhóm
`main` giữ trạng thái build được; nhánh `feat/<issue>-<name>` hoặc `fix/...`; PR gắn issue, nêu test và cần review; không merge khi CI đỏ. Conventional Commits. DoD: AC và truy vết, lint/test/build, docs cập nhật, không secret, PR review.

## Cần nhóm bổ sung
Tên thành viên/MSSV; remote repository và quyền giảng viên; branch protection; DNS cho web/API; VPS/SSH secrets; chạy release thực tế và lưu URL; demo và retrospective. Không có bằng chứng thật thì không được coi production đã hoàn tất.
