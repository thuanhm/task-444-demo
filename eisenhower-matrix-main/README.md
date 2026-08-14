# Ma trận Eisenhower — VietinBank Chi nhánh Bắc Nghệ An

Ứng dụng quản lý công việc theo Ma trận Eisenhower (4 nhóm ưu tiên), giao diện tiếng Việt,
màu sắc theo nhận diện thương hiệu VietinBank.

## Tính năng

**Theo dõi việc giao cho các phòng**
- Mỗi công việc có: nội dung, **phòng phụ trách**, người thực hiện, hạn chót,
  loại công việc, trạng thái (Chưa bắt đầu / Đang làm / Hoàn thành), ghi chú tiến độ
- Thống kê **theo phòng phụ trách**: tổng việc, đang làm, hoàn thành, quá hạn, tỷ lệ hoàn thành
- Cảnh báo hạn chót: thẻ ngày đổi màu theo số ngày còn lại; bảng cảnh báo riêng
  với ngưỡng đỏ/vàng tự đặt được (mặc định đỏ ≤ 1 ngày, vàng ≤ 4 ngày)
- Bộ lọc: từ khóa, phòng, cán bộ, loại việc, trạng thái, khoảng hạn chót,
  và tùy chọn chỉ hiện việc quá hạn / sắp đến hạn
- Xuất Excel danh sách đang hiển thị; nhập hàng loạt từ Excel/CSV; có tệp mẫu
- **Tạo báo cáo bằng AI (Google Gemini Flash)**: soạn báo cáo văn phong hành chính
  gửi Ban giám đốc / lãnh đạo phòng từ đúng dữ liệu đang lọc, sửa trực tiếp được,
  sao chép hoặc tải về tệp .doc mở bằng Word

**Nền tảng**
- Bốn nhóm ưu tiên Eisenhower, kéo - thả giữa các nhóm
- Dữ liệu lưu tập trung trên Neon (PostgreSQL), dùng chung nhiều máy
- Đăng nhập bằng mã truy cập của phòng
- Song ngữ: Tiếng Việt (mặc định) và English

## Bảng màu và font chữ

| Vai trò | Mã màu | Ghi chú |
|---|---|---|
| Xanh rất đậm | `#00203F` | Header, viền, chữ chính |
| Xanh chủ đạo | `#004A8F` | Nút chính, nhóm "Lên lịch" |
| Xanh sáng | `#1568B8` | Hover, liên kết |
| Đỏ | `#EE1C25` | Nhóm "Làm ngay" |
| Vàng đồng | `#D8A13B` | Nhóm "Giao việc" |
| Xanh lá | `#1E8E5A` | Trạng thái "Hoàn thành" |
| Cam vàng | `#C6801E` | Cảnh báo sắp đến hạn |
| Đỏ đậm | `#D23B3B` | Quá hạn |
| Xám chữ phụ | `#5C6B7F` | Nhóm "Loại bỏ", chữ phụ |
| Nền | `#EEF2F7` | Nền tổng thể |

Font chữ: **Plus Jakarta Sans**, nạp qua Google Fonts trong `app/globals.css`.

Mã màu được khai báo tập trung tại `app/globals.css` (biến CSS `--vtb-*`),
`constants/index.ts` (đối tượng `COLORS`), và `components/AntdThemeProvider.tsx`
(token màu của Ant Design) — sửa cả ba chỗ này khi cần đổi màu để giao diện
Tailwind và Ant Design luôn khớp nhau.

## Responsive

Đã kiểm tra và tối ưu cho ba mốc màn hình chính:
- **Di động** (< 640px): dải số liệu 3 cột, form 1 cột, ma trận 4 nhóm xếp dọc,
  bảng cuộn ngang, hộp thoại tự co theo `calc(100vw - 16px)`.
- **Máy tính bảng** (640–1024px): bộ lọc 2 cột, form 2 cột, ma trận vẫn xếp dọc
  để mỗi nhóm đủ rộng.
- **Máy tính để bàn** (≥ 1024px): dải số liệu 6 cột, bộ lọc 4 cột, ma trận 2×2.

## Chạy ứng dụng

```bash
npm install
npm run dev      # mở http://localhost:3000 -> tự chuyển tới /vi
npm run build    # bản chạy thật
npm start
```

## Cấu trúc chính

```
app/[locale]/          Trang chính và layout theo ngôn ngữ
components/            Header, Footer, QuadrantCard, TaskItem, các hộp thoại
constants/index.ts     Bảng màu VietinBank, cấu hình 4 nhóm, dữ liệu mẫu
hooks/useTasks.ts      Logic thêm/sửa/xóa/di chuyển công việc + lưu localStorage
i18n/config.ts         Cấu hình ngôn ngữ (vi mặc định, en dự phòng)
public/locales/vi/     Toàn bộ nội dung tiếng Việt
```

## Thay đổi nội dung hiển thị

Mọi chữ trên giao diện nằm trong `public/locales/vi/common.json`.
Ví dụ đổi tên đơn vị: sửa `header.unit`.

## Công nghệ

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · **Ant Design 5**
(giao diện: Form, Table, Modal, DatePicker...) · dnd-kit (kéo - thả) · Chart.js
(biểu đồ) · Neon/PostgreSQL · Google Gemini Flash (tạo báo cáo)

## Giao diện Ant Design

Toàn bộ form, bảng, hộp thoại, nút bấm dùng thư viện Ant Design để chuyên
nghiệp và nhất quán hơn (validate form, sắp xếp/lọc bảng, chọn ngày kiểu
Việt Nam...). Màu sắc của AntD được đổi theo nhận diện VietinBank tại
`components/AntdThemeProvider.tsx` — sửa `token.colorPrimary` và các màu
trong `theme.token` ở đó, mọi component AntD trong app tự đổi theo, không
cần sửa từng nơi.
