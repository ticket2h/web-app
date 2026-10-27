# Ticket2h web-app

App web của Ticket2h (mua vé, vé của tôi, ban tổ chức, soát vé, quản trị): SPA **React 19 + Vite + TypeScript**, thư viện giao diện
[momi-ui](https://github.com/HoangDuong2k/momi-ui) (Tailwind CSS v4 + Radix), TanStack Query, React Router,
react-hook-form + zod. Kiểu dữ liệu API sinh từ OpenAPI của các service. Quyết định thiết kế:
[infra ADR-015](https://github.com/ticket2h/infra/blob/main/docs/adr/015-web-gateway-refresh-token.md).

## Có gì

| Vai trò | Trang | Làm được |
|---|---|---|
| Khách | `/`, `/events/:id` | Tìm sự kiện (gõ không dấu), xem chi tiết, chọn ghế trên sơ đồ trực tiếp (ghế người khác vừa giữ chuyển xám ngay, qua SSE; M5), chọn vé đứng; sự kiện có phòng chờ thì tự xếp hàng, thấy vị trí giảm dần, đến lượt mới chọn ghế (M5) |
| | `/register`, `/login` | Đăng ký rồi đăng nhập luôn; giữ phiên qua refresh token |
| | `/orders/:id` | Giữ chỗ (đếm ngược), thanh toán qua MockPay, huỷ đơn; tự hỏi lại tới khi có vé |
| | `/me/orders`, `/me/tickets` | Đơn hàng; vé theo sự kiện, mã QR, chuyển nhượng cho tài khoản khác |
| Ban tổ chức | `/organizer`, `/organizer/events/:id` | Địa điểm; tạo/sửa sự kiện (giờ theo múi giờ nơi diễn); loại vé ngồi/đứng; xếp ghế theo khối hoặc nhập cả sơ đồ từ file CSV (báo từng dòng lỗi); phân công nhân viên soát vé; công bố (kiểm tra trước điều kiện); đổi giá vé cả khi đang bán (M6); bật phòng chờ, chọn số người vào mỗi giây, xem số người đang chờ (M5) |
| | `?tab=sales` | Doanh thu (M4): doanh thu, vé, đơn; biểu đồ theo ngày (di chuột hoặc phím mũi tên để xem từng ngày), theo loại vé, theo kênh; bảng sắp xếp ở BE (bấm tiêu đề cột). Cách gom và cột sắp xếp nằm trên URL |
| | `?tab=orders` | Đơn hàng (M4): người mua, vé, tiền, kênh, trạng thái; lọc trạng thái; "Xem thêm" theo cursor (keyset), sự kiện 200.000 đơn vẫn nhanh |
| | nút "Xuất file" | Tải CSV danh sách khách và lịch sử soát vé (chọn khoảng ngày, tối đa 31 ngày); tải bằng `fetch` kèm access token rồi mới lưu |
| Soát vé | `/checkin?gate=A1` | Quét QR bằng camera (trình duyệt có `BarcodeDetector`) hoặc dán mã; kết quả lớn theo màu, lịch sử lượt quét |
| Quản trị | `/admin` | Tìm, lọc tài khoản ("Xem thêm" theo cursor, chạy được với 2 triệu tài khoản); tạo tài khoản ban tổ chức, soát vé, quản trị; tạo ban tổ chức |
| | `?tab=audit` | Lịch sử thao tác (M6): hai nguồn (bán vé ở core, tài khoản ở identity), lọc theo thao tác, "Xem thêm" theo cursor |

Giao diện: nền giấy ấm, màu son, poster tự vẽ cho từng sự kiện (`shared/ui/PosterArt.tsx`, chưa có ảnh từ BE), cuống
vé có khuyết ở vé của tôi. Chữ: Be Vietnam Pro (giao diện) và Bricolage Grotesque (tiêu đề), tải từ Google Fonts.
Có chế độ tối, dùng được trên điện thoại. Biểu đồ doanh thu tự vẽ bằng HTML/Tailwind (momi-ui chưa có biểu đồ, không
thêm thư viện): cột mảnh một màu (`--chart` trong `index.css`, đã kiểm tra độ tương phản ở cả hai chế độ), ngày không
bán được vé vẫn có chỗ trên trục thời gian, bảng bên dưới có đủ số liệu cho ai không xem được biểu đồ.

Thử với dữ liệu lớn: `../infra/scripts/datagen.sh` rồi đăng nhập `organizer1@test.local`, mở "Đại nhạc hội Ticket2h
2026" (200.000 đơn).

### Luồng mua vé

1. Trang sự kiện gửi `POST /orders` với `Idempotency-Key` (giữ nguyên khi bấm lại cùng lựa chọn, đổi khi lựa chọn
   đổi). Ghế vừa có người giữ (`SEAT_UNAVAILABLE`) được bỏ khỏi lựa chọn và sơ đồ tải lại. Sự kiện có phòng chờ: kèm
   header `Admission-Token` (vé vào cửa lấy từ `POST /events/{id}/waiting-room`, chỉ nằm trong bộ nhớ); hết hạn
   (`ADMISSION_REQUIRED`) thì xếp hàng lại.

Sơ đồ ghế trực tiếp (`features/events/useSeatStream.ts`, `liveSeats.ts`): mở `EventSource` tới
`/api/core/events/{id}/seats/stream` trước, tải ảnh chụp sau; mỗi thay đổi mang `version` của ghế, chỉ áp khi lớn hơn
cái đang hiển thị (thay đổi đến trễ hay đến hai lần không làm sai). Ảnh chụp có `Seat-Map-Seq` nhỏ hơn số của `hello`
thì tải lại. Không nối được SSE thì quay về tải lại 15 giây một lần; có SSE vẫn tải lại mỗi 60 giây làm lưới an toàn.
2. Trang đơn hàng tạo phiên thanh toán (`POST /orders/{id}/payments`) rồi chuyển trình duyệt sang MockPay.
3. MockPay chuyển về `/payments/return?orderId=...&status=...` (core gắn `orderId` vào return-url). `status` không có
   chữ ký nên chỉ để chọn lời nhắn; trang đơn hỏi lại mỗi 2 giây tới khi webhook đổi đơn sang PAID rồi FULFILLED.

return-url mặc định của core trỏ về `http://localhost:5173` (`npm run dev`); trong compose là `http://localhost:3000`.

## Chạy khi dev

Cần identity-service (8082) và core-service (8080) đang chạy với profile `dev` (tài khoản và sự kiện mẫu). Muốn
thanh toán và nhận email thì cần thêm mock-payment-gateway và notification-service. Cách nhanh nhất, với các repo clone
cạnh nhau ([infra/docs/chay-tren-may-moi.md](https://github.com/ticket2h/infra/blob/main/docs/chay-tren-may-moi.md)):

```bash
(cd ../infra && scripts/init-env.sh && docker compose --profile apps up -d)
(cd ../infra && docker compose stop web-app)    # không bắt buộc: chỉ để khỏi nhầm hai bản web
npm install
npm run dev          # http://localhost:5173
```

Core trong compose chuyển trình duyệt về `localhost:3000` sau khi thanh toán (bản web trong container). Thử thanh toán
với bản đang sửa ở 5173 thì chạy core bằng `./mvnw` (mặc định trả về 5173), hoặc đổi
`TICKET2H_PAYMENT_MOCKPAY_RETURNURL` trong compose.

Thử soát vé khi máy không có camera (Chrome trên Linux, Windows chưa có `BarcodeDetector`): mở vé ở "Vé của tôi",
bấm "Chép mã QR dạng chữ (dev)" (chỉ có khi `npm run dev`, cần core profile dev), rồi dán vào trang Soát vé bằng
tài khoản `staff1@test.local`.

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
docker build -t ghcr.io/ticket2h/web-app .
docker run -p 3000:80 -e IDENTITY_UPSTREAM=http://host.docker.internal:8082 -e CORE_UPSTREAM=http://host.docker.internal:8080 ghcr.io/ticket2h/web-app
```

nginx tra tên trong `*_UPSTREAM` bằng DNS lúc chạy (mỗi 10 giây), không đọc `/etc/hosts`: service trong compose đổi IP
khi được tạo lại thì web-app vẫn tìm ra. `host.docker.internal` có sẵn trong DNS của Docker Desktop; trên Linux thì
dùng IP của máy host nhìn từ container, ví dụ `-e CORE_UPSTREAM=http://172.17.0.1:8080` (nginx không cần tra IP).
Gateway nén gzip mọi response JSON/CSV (sơ đồ 122.915 ghế: 20,5MB còn 2,1MB).

Trong `infra`: `docker compose --profile apps up -d` chạy cả web-app ở http://localhost:3000. CI build image mỗi lần push
lên `main` (giống các repo service).

## Cấu trúc

```
src/
├── main.tsx              điểm vào: providers, khôi phục phiên, router
├── app/                  providers (theme, locale vi, query, toast), router (trang tải lười theo vai trò), layout
├── shared/
│   ├── api/              client openapi-fetch, ApiError/ProblemDetail, kiểu; generated/ do script sinh, không sửa tay
│   ├── auth/             phiên (token trong bộ nhớ, refresh), useSession, AuthBootstrap, RequireAuth, RequireRole
│   ├── format/           tiền (VND, dạng gọn "1,2 tỷ" cho trục biểu đồ), giờ theo múi giờ sự kiện, giờ treo tường ↔ ISO
│   ├── ui/               PosterArt, PageHeader, EmptyState, QueryError, badge trạng thái
│   ├── download.ts       lưu file tải bằng fetch (CSV cần access token)
│   └── hooks/            useNow (đếm ngược)
├── features/
│   ├── auth/             đăng nhập, đăng ký, tài khoản
│   ├── events/           danh sách, chi tiết, sơ đồ ghế, giỏ vé (checkout.ts)
│   ├── orders/           đơn hàng, thanh toán, trang quay về từ MockPay
│   ├── tickets/          vé của tôi, QR, chuyển nhượng
│   ├── organizer/        sự kiện, địa điểm, loại vé, xếp ghế, nhập ghế từ CSV, nhân viên, công bố;
│   │                     doanh thu (SalesPanel, SalesChart, sales.ts), đơn hàng, xuất file
│   ├── checkin/          soát vé: camera (BarcodeDetector) hoặc nhập tay
│   └── admin/            tài khoản, ban tổ chức
└── test/                 setup Vitest, renderApp, mockApi, signIn
nginx/                    cấu hình gateway trong image
scripts/gen-api-types.mjs sinh kiểu từ OpenAPI
```

## Việc tiếp theo

- Quét QR trên mọi trình duyệt: `BarcodeDetector` chưa có trên Chrome desktop Linux/Windows và Firefox. Cần một thư
  viện đọc QR (ví dụ `jsqr`): thêm dependency, chờ duyệt.
- BE chưa có: ảnh sự kiện (đang dùng poster tự vẽ), danh sách sự kiện được phân công cho nhân viên soát vé, xem
  trước sơ đồ ghế khi sự kiện còn nháp (API ghế chỉ mở cho sự kiện đã công bố), múi giờ trong `TicketResponse`.
- Rút ngắn TTL access token khi refresh đã ổn định (ADR-015).
- File CSV lớn (500.000 dòng, vài chục MB) nằm trọn trong bộ nhớ trình duyệt trước khi lưu. Muốn tải thẳng xuống đĩa
  thì BE cần link tải có chữ ký ngắn hạn (không cần header Authorization).
- Báo cáo doanh thu chưa có bộ lọc khoảng ngày trên giao diện (API đã có `from`, `to`).
- **Sơ đồ ghế của sự kiện rất lớn**: M5 đã có cache ở BE (một lần đổi JSON mỗi giây cho mọi người, `ETag`/304) và SSE
  (chỉ gửi ghế thay đổi), nhưng trang vẫn tải và vẽ mọi ghế. Với sự kiện sinh 122.915 ghế: API trả 20,5MB JSON (2,1MB
  khi gateway nén gzip), trang có 276.000 nút DOM, heap JS 69MB, vẽ xong sau 1,1 giây trên máy dev, nặng với điện
  thoại. Còn lại: tải theo khu (tổng quan các khu trước, bấm vào khu mới tải ghế và nghe SSE của khu đó).
- Navbar của momi-ui vẽ link bằng `<a href>`; `RootLayout` đang chặn click để chuyển trang trong app. Bỏ khi momi-ui
  cho truyền component link riêng.
