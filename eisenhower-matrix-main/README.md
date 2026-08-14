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

## Bảng màu nhận diện VietinBank

| Vai trò | Mã màu | Ghi chú |
|---|---|---|
| Xanh chủ đạo | `#0072BC` | Đầu trang, nút chính, nhóm "Lên lịch" |
| Xanh đậm | `#003B71` | Đường viền, chữ chính |
| Đỏ | `#E31837` | Nhóm "Làm ngay", nút xóa |
| Vàng đồng | `#F5A81C` | Nhóm "Giao việc", nút thống kê |
| Xám xanh | `#7A8FA6` | Nhóm "Loại bỏ" |
| Nền | `#EEF3F8` | Nền tổng thể |

Các mã màu được khai báo tập trung tại `app/globals.css` (biến CSS `--vtb-*`)
và `constants/index.ts` (đối tượng `COLORS`) — sửa một chỗ là toàn bộ giao diện đổi theo.

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

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · dnd-kit · Chart.js
