# Ticket2h web

Giao diện web của Ticket2h: SPA **React 19 + Vite + TypeScript**, thư viện giao diện
[momi-ui](https://github.com/HoangDuong2k/momi-ui) (Tailwind CSS v4 + Radix), TanStack Query, React Router,
react-hook-form + zod. Kiểu dữ liệu API sinh từ OpenAPI của các service. Quyết định thiết kế:
[infra ADR-015](https://github.com/ticket2h/infra/blob/main/docs/adr/015-web-gateway-refresh-token.md).

Hiện có (P0): đăng nhập / đăng xuất, giữ phiên qua refresh token, trang tài khoản, danh sách sự kiện có tìm kiếm
không dấu và phân trang.

## Chạy khi dev

Cần identity-service (8082) và core-service (8080) đang chạy với profile `dev` (tài khoản và sự kiện mẫu). Cách nhanh
nhất, với các repo clone cạnh nhau ([infra/docs/chay-tren-may-moi.md](https://github.com/ticket2h/infra/blob/main/docs/chay-tren-may-moi.md)):

```bash
(cd ../infra && scripts/init-env.sh && docker compose --profile apps up -d identity-service core-service)
npm install
npm run dev          # http://localhost:5173
```

Tài khoản mẫu: `buyer1@test.local`, `organizer1@test.local`, `staff1@test.local`, `admin@test.local`, mật khẩu `Passw0rd!`.

Service chạy ở chỗ khác: `IDENTITY_URL=http://... CORE_URL=http://... npm run dev`.

## Scripts

| Lệnh | Việc |
|---|---|
| `npm run dev` | Dev server, có proxy `/api/**` tới các service |
| `npm run build` | Kiểm tra kiểu rồi build ra `dist/` |
| `npm run typecheck` | Chỉ kiểm tra kiểu |
| `npm test` | Vitest + Testing Library (jsdom), không cần BE |
| `npm run api:types` | Sinh lại `src/shared/api/generated/*.ts` từ `/v3/api-docs` của service đang chạy |

## Gọi API

Trình duyệt chỉ gọi một origin. Gateway chuyển tiếp và bỏ tiền tố:

| Trình duyệt gọi | Tới | |
|---|---|---|
| `/api/identity/**` | identity-service `/**` | Cookie refresh đổi `Path=/auth` thành `/api/identity/auth` |
| `/api/core/**` | core-service `/**` | |
| `/api/*/internal/**`, `/api/*/actuator/**` | 404 | API nội bộ giữa các service không mở ra ngoài |

Khi dev, gateway là proxy của Vite (`vite.config.ts`). Trong image, gateway là nginx (`nginx/default.conf.template`).

- Client: `src/shared/api/client.ts` (`coreApi`, `identityApi`, openapi-fetch có kiểu theo đường dẫn).
- Lỗi: mọi lỗi BE là ProblemDetail có `code`. `unwrap()` ném `ApiError`; xử lý theo `error.code`
  (bảng mã: [core-service/docs/api.md](https://github.com/ticket2h/core-service/blob/main/docs/api.md)).
- Kiểu: `src/shared/api/types.ts` thu hẹp kiểu sinh ra (springdoc để mọi trường response là tùy chọn).

## Đăng nhập

- `POST /auth/login` trả access token (giữ **trong bộ nhớ**, không `localStorage`) và đặt cookie `ticket2h_refresh`
  (`HttpOnly`, JavaScript không đọc được).
- Mở hay tải lại trang: `AuthBootstrap` gọi `/auth/refresh` một lần để khôi phục phiên.
- Token sắp hết hạn (còn dưới 30 giây): `getAccessToken()` tự gọi refresh. Identity xoay vòng refresh token mỗi lần
  dùng và coi token cũ bị dùng lại là bị đánh cắp, nên refresh phải tuần tự: trong một tab dùng chung một promise,
  giữa các tab dùng Web Locks (`navigator.locks`).
- Trang cần đăng nhập bọc trong `<RequireAuth>`; chưa đăng nhập thì sang `/login?next=...`. `next` chỉ nhận đường dẫn
  trong app (`safeNext`).

## Docker

```bash
docker build -t ghcr.io/ticket2h/web .
docker run -p 3000:80 -e IDENTITY_UPSTREAM=http://host.docker.internal:8082 -e CORE_UPSTREAM=http://host.docker.internal:8080 ghcr.io/ticket2h/web
```

Trong `infra`: `docker compose --profile apps up -d` chạy cả web ở http://localhost:3000. CI build image mỗi lần push
lên `main` (giống các repo service).

## Cấu trúc

```
src/
├── main.tsx              điểm vào: providers, khôi phục phiên, router
├── app/                  providers (theme, locale vi, query, toast), router, layout (navbar)
├── shared/
│   ├── api/              client openapi-fetch, ApiError/ProblemDetail, kiểu; generated/ do script sinh, không sửa tay
│   └── auth/             phiên (token trong bộ nhớ, refresh), useSession, AuthBootstrap, RequireAuth
├── features/
│   ├── auth/             đăng nhập, tài khoản
│   └── events/           danh sách sự kiện
└── test/                 setup Vitest, renderApp, mockApi
nginx/                    cấu hình gateway trong image
scripts/gen-api-types.mjs sinh kiểu từ OpenAPI
```

## Việc tiếp theo

- P1: chi tiết sự kiện, sơ đồ ghế, đặt vé (`Idempotency-Key`), thanh toán MockPay (đổi `return-url` của core về web).
- Tách bundle theo route (`React.lazy`): bundle P0 khoảng 207 kB gzip, phần lớn là momi-ui.
- Navbar của momi-ui vẽ link bằng `<a href>`; `RootLayout` đang chặn click để chuyển trang trong app. Bỏ khi momi-ui
  cho truyền component link riêng.
