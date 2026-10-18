# Ticket2h web

SPA React 19 + Vite + TypeScript cho Ticket2h, giao diện bằng momi-ui. Một trong các repo của hệ thống (cạnh
`../infra`, `../core-service`, `../identity-service`); kiến trúc và quyết định: `../infra/docs/` (ADR-015 cho web).

## Lệnh
- Dev: `npm run dev` (cần identity :8082 và core :8080 chạy profile dev)
- Kiểm tra trước khi xong việc: `npm run typecheck && npm test && npm run build`
- Sinh lại kiểu API sau khi BE đổi: `npm run api:types` (service phải đang chạy), commit `src/shared/api/generated/`

## Quy ước bắt buộc
- Giao diện: dùng component của momi-ui trước, xem skill `momi-ui` (`.claude/skills/momi-ui`). Không tự vẽ thứ thư
  viện đã có; class Tailwind viết nguyên văn, không ghép chuỗi.
- Chữ hiển thị tiếng Việt. Giờ sự kiện hiển thị theo `timeZone` của sự kiện (`formatEventTime`).
- Gọi API qua `coreApi` / `identityApi` (`src/shared/api/client.ts`) và `unwrap()`; không `fetch` thẳng tới service,
  trừ `shared/auth/session.ts` (refresh/logout, tránh vòng lặp với middleware gắn token).
- Không sửa tay `src/shared/api/generated/`. Thu hẹp kiểu trong `src/shared/api/types.ts`, ghi rõ vì sao trường đó
  luôn có giá trị.
- Lỗi xử lý theo `ApiError.code`, không theo chuỗi `detail`.
- Access token chỉ ở trong bộ nhớ (`session.ts`). Không lưu token vào `localStorage`/`sessionStorage`, không log token.
- Trạng thái lọc, tìm kiếm, phân trang để trên URL (`useSearchParams`).
- Code mới theo feature: `src/features/<tên>/` (trang, hook gọi API, hàm thuần + test cạnh nhau).
- Test: hàm thuần test thẳng; trang test qua `renderApp(path)` + `mockApi({...})` (`src/test/render.tsx`).

## Cấm
- Không thêm dependency mới nếu chưa hỏi.
- Không sửa `node_modules`, không chép source của momi-ui vào app. Thiếu gì ở momi-ui thì làm workaround nhỏ có
  ghi chú và đề xuất cho thư viện.
- Không gọi `/internal/**` của service từ web.
