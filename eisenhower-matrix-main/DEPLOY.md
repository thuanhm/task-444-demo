# Hướng dẫn triển khai lên Vercel + Neon

## Bước 1 — Tạo cơ sở dữ liệu Neon

1. Vào https://neon.tech, đăng ký tài khoản (gói Free là đủ dùng cho một phòng).
2. Create project → đặt tên `eisenhower-bac-nghe-an`, chọn region gần nhất
   (Singapore `ap-southeast-1`).
3. Mở **SQL Editor**, dán toàn bộ nội dung file `db/schema.sql` rồi bấm **Run**.
   Tệp này chạy lại được nhiều lần — nếu anh đã tạo bảng từ phiên bản trước,
   cứ chạy lại để bổ sung các cột mới (phòng phụ trách, hạn chót, trạng thái...).
4. Vào **Connection Details**, chọn kiểu **Pooled connection**, copy chuỗi
   `postgresql://...-pooler...?sslmode=require` — đây là `DATABASE_URL`.

> Lưu ý: phải dùng bản **pooled** (có chữ `-pooler`), vì Vercel chạy serverless,
> mỗi request là một kết nối mới.

## Bước 2 — Đưa mã nguồn lên GitHub

```bash
git init
git add .
git commit -m "Ma tran Eisenhower - VietinBank Bac Nghe An"
git branch -M main
git remote add origin https://github.com/<tai-khoan>/<ten-repo>.git
git push -u origin main
```

Repo nên để **Private**.

## Bước 3 — Deploy trên Vercel

1. https://vercel.com → **Add New… → Project** → chọn repo vừa đẩy lên.
2. Framework Preset: Next.js (Vercel tự nhận), giữ nguyên các thiết lập khác.
3. Mở **Environment Variables**, thêm 4 biến (áp dụng cho cả Production, Preview, Development):

| Tên biến | Giá trị |
|---|---|
| `DATABASE_URL` | chuỗi pooled lấy ở Bước 1 |
| `APP_ACCESS_KEY` | mã truy cập của phòng, tự đặt, nên dài trên 16 ký tự |
| `WORKSPACE_ID` | `bac-nghe-an` |
| `NEXT_PUBLIC_SITE_URL` | địa chỉ trang sau khi deploy, ví dụ `https://eisenhower-bnah.vercel.app` |
| `GEMINI_API_KEY` | khóa API Google Gemini, lấy tại https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | `gemini-2.0-flash` (có thể bỏ trống) |

> Khóa Gemini chỉ nằm ở phía máy chủ, trình duyệt không nhìn thấy.
> Nếu chưa đặt `GEMINI_API_KEY`, mọi chức năng khác vẫn chạy bình thường,
> riêng nút "Tạo báo cáo" sẽ báo là máy chủ chưa cấu hình.

4. Bấm **Deploy**. Sau khoảng 1–2 phút, mở địa chỉ Vercel cấp, trang sẽ tự chuyển
   sang `/vi` và hiện màn hình nhập mã truy cập.

Mỗi lần `git push` lên nhánh `main`, Vercel tự build lại.

## Bước 4 — Phát cho cán bộ trong phòng

- Gửi địa chỉ trang và mã truy cập `APP_ACCESS_KEY`.
- Mã được lưu trong trình duyệt, chỉ phải nhập một lần trên mỗi máy.
- Bấm **Thoát** ở góc phải đầu trang để xóa mã khỏi máy đó.
- Đổi mã: sửa `APP_ACCESS_KEY` trên Vercel → **Redeploy**; mọi máy sẽ phải nhập lại.

## Chạy thử trên máy cá nhân

```bash
cp .env.example .env.local   # điền DATABASE_URL và APP_ACCESS_KEY
npm install
npm run dev                  # http://localhost:3000
```

## Cách dữ liệu được lưu

- Toàn bộ công việc nằm ở bảng `tasks` trên Neon, dùng chung cho cả phòng.
- Thao tác thêm/sửa/xóa/kéo-thả hiện ngay trên màn hình rồi mới gửi lên máy chủ;
  nếu máy chủ báo lỗi, ứng dụng tự tải lại dữ liệu thật và hiện thông báo đỏ.
- Trang tự làm mới khi anh quay lại tab, nên thấy được thay đổi của người khác.
  Đây là bản dùng chung đơn giản, chưa có cập nhật tức thời (realtime) và chưa
  ghi nhận ai là người sửa — nếu cần, có thể bổ sung sau.

## Chi phí

Neon Free: 0,5 GB lưu trữ, thừa cho hàng chục nghìn công việc.
Vercel Hobby: miễn phí, nhưng theo điều khoản chỉ dành cho mục đích phi thương mại —
nếu dùng chính thức trong công việc của chi nhánh thì nên dùng gói Pro,
hoặc triển khai trên hạ tầng nội bộ.
